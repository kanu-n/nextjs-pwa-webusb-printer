# Next.js PWA WebUSB Thermal Printer - Quick Start

## 🚀 Quick Setup

```bash
# Navigate to project directory
cd /home/hello/Documents/mine/nextjs-pwa-webusb-printer

# Run the setup script
./setup.sh

# Or manually:
npm install
npm run dev
```

## 📱 Access the App

Open http://localhost:3000 in a WebUSB-compatible browser (Chrome, Edge, Opera)

## 🖨️ Testing Without a Printer

If you don't have a USB thermal printer:
1. The app will show "WebUSB not supported" in Firefox/Safari
2. Use the "Browser Print (Fallback)" option to test functionality
3. In Chrome/Edge, you can still see the UI without connecting a printer

## 🔧 Common Vendor IDs for Thermal Printers

- Epson: 0x04b8
- Star Micronics: 0x0519
- Bixolon: 0x1504
- Citizen: 0x1d90
- Custom Engineering: 0x0dd4

## 📝 Project Structure Highlights

- `/components/PrinterController.tsx` - Main USB control logic
- `/utils/escpos.ts` - ESC/POS command builder
- `/examples/advanced-printing.ts` - Receipt examples

## 🚨 Troubleshooting

1. **Permission Denied**: Make sure scripts are executable
   ```bash
   chmod +x setup.sh generate-icons.sh
   ```

2. **USB Not Working**: Check browser console for errors
   - Ensure HTTPS or localhost
   - Try different USB ports
   - Check printer power

3. **Build Errors**: Clear cache
   ```bash
   rm -rf .next node_modules
   npm install
   ```

## 🎯 Next Steps

1. Connect your thermal printer
2. Click "Connect Printer" and select your device
3. Test print functionality
4. Install as PWA for offline use
5. Customize ESC/POS commands in `/utils/escpos.ts`

Enjoy your WebUSB thermal printer PWA! 🎉
