# Next.js PWA WebUSB Thermal Printer

A Progressive Web App (PWA) built with Next.js that connects to thermal printers via WebUSB API and supports ESC/POS commands.

## Features

- 🔌 **WebUSB Integration**: Direct USB connection to thermal printers without drivers
- 📱 **PWA Support**: Installable as a native-like app with offline capabilities
- 🖨️ **ESC/POS Commands**: Full support for thermal printer command protocol
- 🔄 **Fallback Support**: Falls back to browser print when WebUSB is unavailable
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Prerequisites

- Node.js 16+ and npm/yarn
- A WebUSB-compatible browser (Chrome, Edge, Opera)
- A USB thermal printer (ESC/POS compatible)

## Setup Instructions

1. **Clone/Navigate to the project**:
   ```bash
   cd /home/hello/Documents/mine/nextjs-pwa-webusb-printer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Generate PWA icons** (optional):
   ```bash
   ./generate-icons.sh
   ```
   Or manually create icon files:
   - `public/icon-192x192.png`
   - `public/icon-512x512.png`
   - `public/favicon.ico`

4. **Run development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm run start
   # or
   yarn build
   yarn start
   ```

## Project Structure

```
nextjs-pwa-webusb-printer/
├── components/
│   └── PrinterController.tsx    # Main printer control component
├── pages/
│   ├── _app.tsx                # Next.js app wrapper
│   ├── _document.tsx           # Document structure
│   └── index.tsx               # Home page
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icon.svg               # Icon source
├── styles/
│   └── globals.css            # Global styles
├── utils/
│   └── escpos.ts              # ESC/POS command utilities
├── next.config.js             # Next.js + PWA config
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind CSS config
└── tsconfig.json              # TypeScript config
```

## Usage

1. **Connect Printer**:
   - Click "Connect Printer" button
   - Select your USB thermal printer from the dialog
   - Grant permission to access the device

2. **Print Test Page**:
   - Enter custom text in the input field
   - Click "Print Test Page"
   - The printer will output a formatted test receipt

3. **Install as PWA**:
   - Look for the install prompt or use browser's install option
   - The app will be available offline after installation

## WebUSB Browser Support

- ✅ Chrome/Chromium (Desktop & Android)
- ✅ Microsoft Edge
- ✅ Opera
- ❌ Firefox (no WebUSB support)
- ❌ Safari (no WebUSB support)

## Supported Printers

This app works with most ESC/POS compatible thermal printers:
- Epson TM series (TM-T20, TM-T88, etc.)
- Star TSP series
- Generic 58mm/80mm USB thermal printers
- Most POS thermal receipt printers

## ESC/POS Commands

The app includes a utility class for common ESC/POS commands:
- Text formatting (bold, underline, size)
- Text alignment (left, center, right)
- Paper feed and cut
- Barcode printing
- QR code printing (simplified)

## Security Notes

- WebUSB requires HTTPS in production (except localhost)
- Users must explicitly grant permission for each USB device
- The app can only access devices the user selects

## Troubleshooting

1. **"WebUSB not supported"**:
   - Use a compatible browser (Chrome, Edge, Opera)
   - Ensure you're on HTTPS or localhost

2. **"Could not claim any interface" / Device busy error**:
   - **Most common issue!** Close all printer software (Star utilities, POS apps)
   - Disconnect USB cable, wait 10 seconds, reconnect
   - Try the "Reset Connection" button in the app
   - Disable printer in Device Manager (Windows) or System Preferences (macOS)
   - Use different USB port
   - Restart browser after closing printer software
   - Run `./troubleshoot-webusb.sh` for automated help

3. **Printer not showing in device list**:
   - Check USB connection
   - Try a different USB port
   - Ensure printer is powered on
   - Some printers may need specific vendor/product IDs

4. **Print commands not working**:
   - Check endpoint number (usually 1 for output)
   - Verify printer supports ESC/POS commands
   - Try different configuration/interface numbers

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
