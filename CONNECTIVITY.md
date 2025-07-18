# Multi-Printer Connectivity & Integration Guide

## Overview

This Next.js PWA now supports four different printer connection types with advanced integration features:

- 🔌 **USB** - Direct WebUSB connection (original functionality)
- 🌐 **Network** - TCP/IP network printers via proxy server
- 📶 **Bluetooth** - Wireless Web Bluetooth API
- 🔗 **API** - Remote printing via REST API endpoints

## Quick Start

### 1. Install Dependencies
```bash
npm install
# Install new dependencies for connectivity features
npm install ws @types/ws concurrently
```

### 2. Start Development Environment
```bash
# Start both web app and network proxy server
npm run dev:full

# Or start individually:
npm run dev      # Web app only
npm run proxy    # Network proxy server only
```

### 3. Access the Application
- **Web App**: http://localhost:3000
- **Proxy Server**: http://localhost:8080
- **Switch between interfaces** using the toggle buttons

## Connection Types

### USB Connection (WebUSB)
**Original functionality - enhanced for multi-printer support**

```typescript
// Automatic discovery
const usbPrinters = await printerManager.discoverUSBPrinters();

// Manual configuration
await printerManager.addPrinter({
  name: 'My USB Printer',
  type: 'usb',
  vendorId: 0x0416,
  productId: 0x5011
});
```

**Browser Support**: Chrome, Edge, Opera (HTTPS required in production)

### Network Connection (TCP/IP)
**New feature - requires proxy server**

```typescript
// Add network printer
await printerManager.addPrinter({
  name: 'Network Printer',
  type: 'network',
  ipAddress: '192.168.1.100',
  port: 9100
});

// Discovery
const networkPrinters = await printerManager.discoverNetworkPrinters();
```

**Setup Requirements**:
1. Start proxy server: `npm run proxy`
2. Ensure printer is on same network
3. Printer must support ESC/POS over TCP (port 9100)

### Bluetooth Connection (Web Bluetooth)
**New feature - wireless printing**

```typescript
// Add Bluetooth printer
await printerManager.addPrinter({
  name: 'Bluetooth Printer',
  type: 'bluetooth',
  bluetoothId: 'device-id' // Optional
});

// Discovery
const bluetoothPrinters = await printerManager.discoverBluetoothPrinters();
```

**Browser Support**: Chrome, Edge (Experimental flag may be required)

### API Connection (Remote)
**New feature - cloud/remote printing**

```typescript
// Add API printer
await printerManager.addPrinter({
  name: 'Cloud Printer',
  type: 'api',
  apiEndpoint: 'https://api.printservice.com/v1',
  apiKey: 'your-api-key'
});
```

**API Endpoint Requirements**:
- `GET /status` - Printer status
- `POST /print` - Send print job
- `GET /templates` - Available templates (optional)

## API Endpoints

### Local API Routes

#### Print Job Submission
```
POST /api/print
Content-Type: application/json

{
  "printerType": "network|api",
  "printerConfig": {
    "ip": "192.168.1.100",
    "port": 9100
  },
  "template": "receipt",
  "templateData": {
    "storeName": "My Store",
    "items": [...]
  }
}
```

#### Network Discovery
```
GET /api/discover-network-printers

Response:
{
  "success": true,
  "printers": [
    {
      "id": "network_192_168_1_100",
      "name": "Network Printer (192.168.1.100)",
      "ip": "192.168.1.100",
      "port": 9100,
      "status": "online"
    }
  ]
}
```

#### Print History
```
GET /api/print-history?limit=50&status=completed
POST /api/print-history  # Add job
PUT /api/print-history   # Update job
DELETE /api/print-history # Remove job
```

#### Templates
```
GET /api/templates

Response:
{
  "success": true,
  "templates": [
    {
      "id": "receipt",
      "name": "Receipt Template",
      "description": "Standard store receipt",
      "fields": ["storeName", "items", "total"]
    }
  ]
}
```

## Template System

### Built-in Templates

1. **Receipt** - Store receipts with items and totals
2. **Label** - Product labels with barcodes
3. **Ticket** - Kitchen order tickets
4. **Shipping** - Shipping labels with addresses
5. **Badge** - Name badges for events
6. **QR Menu** - Menu items with QR codes

### Using Templates

```typescript
// Template-based printing
const response = await fetch('/api/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    printerType: 'network',
    printerConfig: { ip: '192.168.1.100' },
    template: 'receipt',
    templateData: {
      storeName: 'Awesome Store',
      items: [
        { name: 'Coffee', price: 4.50 },
        { name: 'Sandwich', price: 8.99 }
      ],
      total: 13.49
    }
  })
});
```

### Custom Template Data

```typescript
// Receipt template
{
  storeName: string,
  address?: string,
  items: Array<{name: string, price: number}>,
  total: number,
  receiptNumber?: string
}

// Label template
{
  productName: string,
  barcode: string,
  price: number
}

// Ticket template
{
  orderNumber: string,
  items: string[],
  notes?: string
}
```

## Network Proxy Server

### Purpose
Browsers cannot directly connect to TCP sockets, so the proxy server enables network printer communication.

### Architecture
```
Web App (Browser) ←→ WebSocket ←→ Proxy Server ←→ TCP ←→ Network Printer
```

### Proxy Server Features

- **WebSocket Gateway**: Bridges web app to TCP printers
- **Network Discovery**: Scans for available printers
- **Direct HTTP API**: REST endpoints for printing
- **Connection Management**: Handles printer connections and errors

### Configuration

```javascript
// proxy-server.js
const PORT = 8080;
const wss = new WebSocket.Server({ server });

// Custom network range for discovery
const baseIP = '192.168.1.'; // Adjust for your network
```

### Usage Examples

```bash
# Start proxy server
node proxy-server.js

# Test direct printing
curl -X POST http://localhost:8080/print \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.168.1.100","port":9100,"data":[27,64,72,101,108,108,111]}'

# Discover printers
curl http://localhost:8080/discover
```

## Printer Manager

### Core Features

```typescript
import { printerManager } from '../utils/PrinterManager';

// Add multiple printers
const usbId = await printerManager.addPrinter({...});
const networkId = await printerManager.addPrinter({...});

// Set active printer
printerManager.setActivePrinter(networkId);

// Print to specific printer
await printerManager.print(data, usbId);

// Event listening
printerManager.addEventListener('printerAdded', (printer) => {
  console.log('New printer:', printer.name);
});
```

### Events

- `printerAdded` - New printer configured
- `printerRemoved` - Printer removed
- `printerStatusChanged` - Connection status changed
- `activePrinterChanged` - Active printer switched
- `printJobAdded` - New print job queued
- `printJobUpdated` - Job status changed

### Persistence
Printer configurations are automatically saved to localStorage and restored on page load.

## User Interface

### Classic Interface
Original single-printer WebUSB interface for backward compatibility.

### Multi-Printer Interface
New interface supporting:
- Multiple printer management
- Connection status monitoring
- Print queue visualization
- Printer discovery
- Configuration management

### Template Manager
Visual template editor with:
- Template selection
- Dynamic field configuration
- Real-time preview
- Print history
- Batch printing

## Security Considerations

1. **WebUSB**: Requires explicit user permission for each device
2. **Network**: Proxy server should be on trusted network
3. **Bluetooth**: User must grant permission for device access
4. **API**: Secure API keys and HTTPS endpoints
5. **CORS**: Proxy server enables cross-origin requests for local network

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| WebUSB | ✅ | ✅ | ❌ | ❌ |
| Web Bluetooth | ✅ | ✅ | ❌ | ❌ |
| Network (via proxy) | ✅ | ✅ | ✅ | ✅ |
| API Integration | ✅ | ✅ | ✅ | ✅ |
| PWA Support | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### USB Issues
- Use updated troubleshoot script: `./troubleshoot-webusb.sh`
- Close competing printer software
- Try different USB ports

### Network Issues
```bash
# Test printer connectivity
curl -X POST http://localhost:8080/test \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.168.1.100","port":9100}'

# Check proxy server status
curl http://localhost:8080/status
```

### Bluetooth Issues
- Enable experimental Web Bluetooth features in Chrome flags
- Ensure printer is in pairing mode
- Check printer compatibility with Bluetooth Low Energy (BLE)

### API Issues
- Verify endpoint accessibility
- Check API key permissions
- Ensure HTTPS for production APIs
- Test with curl/Postman first

## Production Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy Proxy Server**
   - Run on same network as printers
   - Configure firewall for port 8080
   - Use process manager (PM2) for production

3. **HTTPS Requirements**
   - WebUSB requires HTTPS in production
   - Use SSL certificates for web app
   - Proxy server can remain HTTP on local network

4. **Environment Configuration**
   ```bash
   # .env.local
   NEXT_PUBLIC_PROXY_URL=http://your-proxy-server:8080
   NEXT_PUBLIC_API_URL=https://your-api-server.com
   ```

## Examples

See the `examples/` directory for:
- Advanced ESC/POS printing
- Custom template creation
- API integration samples
- Network discovery scripts

## Support

For issues with:
- **WebUSB**: Use existing troubleshooting tools
- **Network printing**: Check proxy server logs
- **Bluetooth**: Verify browser compatibility
- **API integration**: Test endpoints independently

## License

MIT License - Same as original project
