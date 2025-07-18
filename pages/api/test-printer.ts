import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ip, port = 9100, timeout = 5000 } = req.body;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const result = await testPrinterConnection(ip, port, timeout);
    
    res.status(200).json({
      success: true,
      ip,
      port,
      online: result.online,
      responseTime: result.responseTime,
      error: result.error
    });

  } catch (error: any) {
    console.error('Printer test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Test failed'
    });
  }
}

async function testPrinterConnection(
  ip: string, 
  port: number, 
  timeout: number
): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // In a real Node.js environment, you would use the 'net' module:
    /*
    const net = require('net');
    
    return new Promise((resolve) => {
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
    */
    
    // For this example, simulate connection testing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
    
    const responseTime = Date.now() - startTime;
    const isOnline = Math.random() > 0.3; // 70% success rate
    
    if (isOnline) {
      return { online: true, responseTime };
    } else {
      return { online: false, error: 'Connection refused' };
    }
    
  } catch (error: any) {
    return { online: false, error: error.message };
  }
}
