# Next.js PWA Multi-Connectivity Thermal Printer

A Progressive Web App (PWA) built with Next.js that connects to thermal printers via **multiple connection methods** including WebUSB, Network, Bluetooth, and API endpoints with full ESC/POS command support.

## 🚀 New Features (Multi-Connectivity)

- 🔌 **Multiple Connection Types**: USB, Network, Bluetooth, and API
- 🖨️ **Multi-Printer Management**: Connect and manage multiple printers simultaneously  
- 📋 **Template System**: Built-in templates for receipts, labels, tickets, and more
- 🌐 **Network Proxy Server**: Bridge for network printer communication
- 📱 **Enhanced PWA**: Advanced offline capabilities and better UX
- 📊 **Print History & Queue**: Track and manage print jobs
- 🔄 **Auto-Discovery**: Automatic detection of compatible printers

## Connection Methods

### 🔌 USB (WebUSB API)
Direct USB connection without drivers
- **Browsers**: Chrome, Edge, Opera
- **Setup**: Plug and play with compatible printers

### 🌐 Network (TCP/IP)
Connect to network-enabled thermal printers
- **Protocol**: TCP/IP on port 9100 (standard)
- **Setup**: Requires proxy server for browser compatibility

### 📶 Bluetooth (Web Bluetooth API)
Wireless connection to Bluetooth printers
- **Browsers**: Chrome, Edge (experimental)
- **Setup**: Pair printer and connect wirelessly

### 🔗 API Integration
Remote printing via REST API endpoints
- **Cloud Printing**: Send jobs to remote print services
- **Custom APIs**: Integrate with existing print infrastructure

## Prerequisites

- Node.js 16+ and npm/yarn
- A compatible browser (Chrome, Edge, Opera for full features)
- For Network printing: Printers supporting ESC/POS over TCP/IP
- For USB: ESC/POS compatible thermal printers
- For Bluetooth: Bluetooth-enabled thermal printers

## Quick Setup

1. **Clone and install**:
   ```bash
   cd /home/hello/Documents/mine/nextjs-pwa-webusb-printer
   npm install
   ```

2. **Start development with all features**:
   ```bash
   npm run dev:full
   ```
   This starts both the web app (port 3000) and network proxy server (port 8080).

3. **Or start individually**:
   ```bash
   npm run dev      # Web app only
   npm run proxy    # Network proxy server only
   ```

4. **Access the application**:
   - Web App: http://localhost:3000
   - Switch between Classic, Multi-Printer, and Template interfaces

## Interface Modes

### Classic Interface
The original WebUSB interface for single printer operation.

### Multi-Printer Interface  
Advanced interface supporting:
- Multiple printer configurations
- Real-time connection monitoring
- Print queue management
- Automatic printer discovery
- Connection diagnostics

### Template Manager
Visual template editor with:
- Pre-built templates (receipts, labels, tickets, etc.)
- Dynamic field configuration
- Real-time preview
- Print history tracking

## Enhanced Project Structure

```
nextjs-pwa-webusb-printer/
├── components/
│   ├── PrinterController.tsx        # Classic single-printer interface
│   ├── MultiPrinterController.tsx   # Multi-printer management
│   ├── AddPrinterModal.tsx         # Printer configuration wizard
│   └── TemplateManager.tsx         # Template editor and manager
├── pages/
│   ├── api/
│   │   ├── print.ts                # Print job API endpoint
│   │   ├── templates.ts            # Template management API
│   │   ├── print-history.ts        # Print history tracking
│   │   ├── discover-network-printers.ts # Network discovery
│   │   └── test-printer.ts         # Printer connectivity testing
│   ├── _app.tsx                    # Next.js app wrapper
│   ├── _document.tsx               # Document structure
│   └── index.tsx                   # Multi-interface home page
├── types/
│   └── printer.ts                  # TypeScript interfaces
├── utils/
│   ├── connectivity/
│   │   ├── USBConnection.ts        # WebUSB implementation
│   │   ├── NetworkConnection.ts    # Network printer connection
│   │   ├── BluetoothConnection.ts  # Bluetooth printer connection
│   │   └── APIConnection.ts        # API endpoint connection
│   ├── PrinterManager.ts           # Multi-printer orchestration
│   └── escpos.ts                   # ESC/POS command utilities
├── proxy-server.js                 # Network printer proxy server
├── CONNECTIVITY.md                 # Detailed connectivity guide
└── examples/                       # Usage examples and templates
```

## Usage

### Multi-Printer Setup

1. **Add Printers**:
   - Click "Add Printer" in Multi-Printer interface
   - Choose connection type (USB, Network, Bluetooth, API)
   - Configure printer settings
   - Test connection

2. **Network Printer Setup**:
   - Ensure proxy server is running (`npm run proxy`)
   - Add printer with IP address (e.g., 192.168.1.100)
   - Test connectivity

3. **USB Printer Setup** (Enhanced):
   - Click "Connect Printer" and select device
   - Now supports multiple USB printers
   - Automatic interface detection

4. **Template Printing**:
   - Switch to Templates interface
   - Select template (receipt, label, ticket, etc.)
   - Fill in template data
   - Preview and print

5. **API Integration**:
   - Configure API endpoint and authentication
   - Use built-in templates or send raw data
   - Monitor print jobs and history

### Development Usage

```javascript
// Import printer manager
import { printerManager } from '../utils/PrinterManager';

// Add multiple printers
const usbPrinterId = await printerManager.addPrinter({
  name: 'USB Thermal Printer',
  type: 'usb'
});

const networkPrinterId = await printerManager.addPrinter({
  name: 'Network Printer',
  type: 'network',
  ipAddress: '192.168.1.100',
  port: 9100
});

// Set active printer
printerManager.setActivePrinter(networkPrinterId);

// Print using templates
const response = await fetch('/api/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template: 'receipt',
    templateData: {
      storeName: 'My Store',
      items: [{ name: 'Coffee', price: 4.50 }],
      total: 4.50
    }
  })
});
```

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| **WebUSB** | ✅ | ✅ | ❌ | ❌ |
| **Web Bluetooth** | ✅ | ✅* | ❌ | ❌ |
| **Network (via proxy)** | ✅ | ✅ | ✅ | ✅ |
| **API Integration** | ✅ | ✅ | ✅ | ✅ |
| **PWA Support** | ✅ | ✅ | ✅ | ✅ |
| **Templates** | ✅ | ✅ | ✅ | ✅ |

*Experimental flag may be required

## Supported Printers

### USB Printers (WebUSB)
- Epson TM series (TM-T20, TM-T88, etc.)
- Star TSP series  
- Generic 58mm/80mm USB thermal printers
- Most POS thermal receipt printers

### Network Printers (TCP/IP)
- Any ESC/POS printer with Ethernet support
- Epson TM-T88V-i, TM-T70-i
- Star TSP654II, TSP143IIILAN
- Custom network print servers
- Print servers supporting port 9100

### Bluetooth Printers
- Star SM-L200, SM-S230i
- Epson TM-P20, TM-P60II  
- Custom Bluetooth thermal printers with BLE
- Mobile POS printers

### API-Connected Services
- Cloud print services
- Custom print APIs
- Enterprise print servers
- Third-party integrations

## Quick Start Script

Use the interactive startup script for easy setup:

```bash
./start.sh
```

Options available:
1. **Full Development** - Web app + proxy server
2. **Web App Only** - Frontend development
3. **Proxy Server Only** - Network printer testing
4. **Production Build** - Build for deployment
5. **Production Start** - Run built application

## API Reference

### Print Job Submission
```bash
curl -X POST http://localhost:3000/api/print \
  -H "Content-Type: application/json" \
  -d '{
    "printerType": "network",
    "printerConfig": {"ip": "192.168.1.100"},
    "template": "receipt",
    "templateData": {
      "storeName": "My Store",
      "items": [{"name": "Coffee", "price": 4.50}],
      "total": 4.50
    }
  }'
```

### Network Discovery
```bash
curl http://localhost:3000/api/discover-network-printers
```

### Template Management
```bash
curl http://localhost:3000/api/templates
```

## Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_PROXY_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=https://your-api-server.com
```

### Proxy Server Configuration
Edit `proxy-server.js` to customize:
- Network discovery range
- Timeout settings  
- CORS policies
- Authentication

## Troubleshooting

### USB Connection Issues
```bash
# Use enhanced troubleshooting script
./troubleshoot-webusb.sh

# Common fixes:
# 1. Close competing printer software
# 2. Try different USB ports
# 3. Reset connection in Multi-Printer interface
```

### Network Printer Issues
```bash
# Test printer connectivity
curl -X POST http://localhost:8080/test \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.168.1.100","port":9100}'

# Check proxy server status
curl http://localhost:8080/status

# Common fixes:
# 1. Ensure printer and computer on same network
# 2. Check printer IP address
# 3. Verify port 9100 is open
# 4. Restart proxy server
```

### Bluetooth Connection Issues
- Enable Web Bluetooth in Chrome flags: `chrome://flags/#enable-web-bluetooth`
- Ensure printer is in pairing mode
- Check printer supports Bluetooth Low Energy (BLE)
- Try clearing browser's Bluetooth cache

### API Integration Issues
- Verify API endpoint accessibility
- Check authentication credentials
- Test with curl/Postman first
- Ensure HTTPS for production APIs
- Check CORS configuration

## Development

To modify ESC/POS commands, edit `utils/escpos.ts`. The command builder pattern allows chaining:

```typescript
const commands = new ESCPOSCommands()
  .init()
  .bold(true)
  .addText('Bold Text\n')
  .bold(false)
  .cut()
```

## License

MIT License - feel free to use this project as a starting point for your own WebUSB applications!
