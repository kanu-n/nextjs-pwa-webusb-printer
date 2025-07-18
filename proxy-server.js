/**
 * Network Printer Proxy Server
 * 
 * This Node.js server acts as a proxy between the web browser and network printers.
 * It's needed because browsers cannot directly connect to TCP sockets.
 * 
 * Usage:
 * 1. Run this server: node proxy-server.js
 * 2. The web app will connect via WebSocket
 * 3. Server forwards print data to actual network printers
 */

const WebSocket = require('ws');
const net = require('net');
const http = require('http');
const url = require('url');

const PORT = 8080;

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

console.log(`🖨️  Network Printer Proxy Server starting on port ${PORT}`);

wss.on('connection', (ws, request) => {
  const query = url.parse(request.url, true).query;
  const printerIP = query.ip;
  const printerPort = parseInt(query.port) || 9100;
  
  console.log(`📡 New WebSocket connection for printer ${printerIP}:${printerPort}`);
  
  if (!printerIP) {
    ws.close(1000, 'Printer IP required');
    return;
  }

  // Store printer connection info
  ws.printerIP = printerIP;
  ws.printerPort = printerPort;
  
  ws.on('message', async (data) => {
    try {
      console.log(`📤 Sending ${data.length} bytes to ${printerIP}:${printerPort}`);
      
      // Create TCP connection to printer
      const socket = new net.Socket();
      
      // Set timeout
      socket.setTimeout(5000);
      
      socket.connect(printerPort, printerIP, () => {
        console.log(`✅ Connected to printer ${printerIP}:${printerPort}`);
        
        // Send data to printer
        socket.write(data);
        
        // Close connection after sending
        setTimeout(() => {
          socket.end();
        }, 1000);
      });
      
      socket.on('data', (response) => {
        console.log(`📥 Printer response: ${response.length} bytes`);
        // Send response back to web client if needed
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'response', 
            data: Array.from(response) 
          }));
        }
      });
      
      socket.on('close', () => {
        console.log(`🔌 Connection to ${printerIP}:${printerPort} closed`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'status', 
            message: 'Print job completed' 
          }));
        }
      });
      
      socket.on('error', (error) => {
        console.error(`❌ Printer connection error: ${error.message}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: error.message 
          }));
        }
      });
      
      socket.on('timeout', () => {
        console.log(`⏰ Connection to ${printerIP}:${printerPort} timed out`);
        socket.destroy();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Connection timeout' 
          }));
        }
      });
      
    } catch (error) {
      console.error(`❌ Error processing print job: ${error.message}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: error.message 
        }));
      }
    }
  });
  
  ws.on('close', () => {
    console.log(`📴 WebSocket connection closed for ${printerIP}:${printerPort}`);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error: ${error.message}`);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: `Connected to proxy for ${printerIP}:${printerPort}` 
  }));
});

// HTTP endpoints for REST API access
server.on('request', (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  // Network printer discovery endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/discover') {
    handleNetworkDiscovery(req, res);
    return;
  }
  
  // Direct print endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/print') {
    handleDirectPrint(req, res);
    return;
  }
  
  // Test endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/test') {
    handlePrinterTest(req, res);
    return;
  }
  
  // Status endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running', 
      connections: wss.clients.size,
      uptime: process.uptime()
    }));
    return;
  }
  
  // 404
  res.writeHead(404);
  res.end('Not found');
});

async function handleNetworkDiscovery(req, res) {
  console.log('🔍 Network printer discovery requested');
  
  // Simple network scan for common printer IPs
  const baseIP = '192.168.1.'; // Adjust for your network
  const discoveries = [];
  
  const scanPromises = [];
  for (let i = 1; i < 255; i++) {
    const ip = baseIP + i;
    scanPromises.push(testPrinterConnection(ip, 9100, 1000));
  }
  
  try {
    const results = await Promise.allSettled(scanPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.online) {
        const ip = baseIP + (index + 1);
        discoveries.push({
          id: `network_${ip.replace(/\./g, '_')}`,
          name: `Network Printer (${ip})`,
          ip: ip,
          port: 9100,
          responseTime: result.value.responseTime
        });
      }
    });
    
    console.log(`✅ Found ${discoveries.length} network printers`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ printers: discoveries }));
    
  } catch (error) {
    console.error('❌ Discovery error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Discovery failed' }));
  }
}

async function handleDirectPrint(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const { ip, port = 9100, data } = JSON.parse(body);
      
      if (!ip || !data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'IP and data required' }));
        return;
      }
      
      console.log(`📤 Direct print to ${ip}:${port}, ${data.length} bytes`);
      
      const printData = new Uint8Array(data);
      const result = await sendToPrinter(ip, port, printData);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        jobId: `job_${Date.now()}`,
        ...result 
      }));
      
    } catch (error) {
      console.error('❌ Direct print error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

async function handlePrinterTest(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const { ip, port = 9100 } = JSON.parse(body);
      
      if (!ip) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'IP required' }));
        return;
      }
      
      console.log(`🧪 Testing printer ${ip}:${port}`);
      
      const result = await testPrinterConnection(ip, port, 5000);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      
    } catch (error) {
      console.error('❌ Printer test error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

function testPrinterConnection(ip, port, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.connect(port, ip, () => {
      const responseTime = Date.now() - startTime;
      socket.destroy();
      resolve({ online: true, responseTime });
    });
    
    socket.on('error', (error) => {
      resolve({ online: false, error: error.message });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ online: false, error: 'Connection timeout' });
    });
  });
}

function sendToPrinter(ip, port, data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    socket.setTimeout(10000);
    
    socket.connect(port, ip, () => {
      socket.write(data);
      
      setTimeout(() => {
        socket.end();
        resolve({ status: 'sent', timestamp: new Date().toISOString() });
      }, 1000);
    });
    
    socket.on('error', (error) => {
      reject(new Error(`Printer connection failed: ${error.message}`));
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Printer connection timeout'));
    });
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Network Printer Proxy Server running on http://localhost:${PORT}`);
  console.log('📡 WebSocket endpoint: ws://localhost:8080/printer-proxy');
  console.log('🔍 Discovery endpoint: http://localhost:8080/discover');
  console.log('🖨️  Direct print endpoint: http://localhost:8080/print');
  console.log('🧪 Test endpoint: http://localhost:8080/test');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
