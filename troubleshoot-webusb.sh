#!/bin/bash

echo "🔧 WebUSB Thermal Printer Troubleshooter"
echo "========================================"

# Check operating system
OS=$(uname -s)

echo "📋 Detected OS: $OS"
echo ""

if [[ "$OS" == "Linux" ]]; then
    echo "🐧 Linux-specific fixes:"
    echo "1. Checking USB printer driver..."
    
    if lsmod | grep -q usblp; then
        echo "   ⚠️  usblp driver is loaded (may conflict with WebUSB)"
        echo "   Run: sudo rmmod usblp"
    else
        echo "   ✅ usblp driver not loaded"
    fi
    
    echo ""
    echo "2. Checking printer devices..."
    lsusb | grep -i "star\|epson\|printer"
    
    echo ""
    echo "3. Current user permissions:"
    groups $USER | grep -q dialout && echo "   ✅ User in dialout group" || echo "   ⚠️  User NOT in dialout group"
    
    echo ""
    echo "🔧 To fix permissions:"
    echo "   sudo usermod -a -G dialout $USER"
    echo "   sudo udevadm control --reload-rules"
    echo "   (Then logout/login)"

elif [[ "$OS" == "Darwin" ]]; then
    echo "🍎 macOS-specific fixes:"
    echo "1. Checking for printer processes..."
    
    ps aux | grep -i "star\|printer" | grep -v grep | head -5
    
    echo ""
    echo "🔧 To fix driver conflicts:"
    echo "   • System Preferences → Printers & Scanners"
    echo "   • Remove your Star printer from the list"
    echo "   • Unplug USB cable for 10 seconds"
    echo "   • Plug back in and try WebUSB immediately"

else
    echo "🪟 Windows/Other OS fixes:"
    echo "1. Open Device Manager"
    echo "2. Find your printer under 'Printers' or 'USB devices'"
    echo "3. Right-click → 'Disable device'"
    echo "4. Unplug USB cable for 10 seconds"
    echo "5. Plug back in and try WebUSB before Windows loads drivers"
fi

echo ""
echo "🌐 Browser-specific tips:"
echo "   • Use Chrome, Edge, or Opera (NOT Firefox/Safari)"
echo "   • Close all printer-related browser tabs"
echo "   • Try incognito/private mode"
echo "   • Clear browser cache if needed"

echo ""
echo "🖨️ Star TSP143IV-UE specific:"
echo "   • Close Star CloudPRNT software"
echo "   • Close Star printer utilities"
echo "   • Check for Star driver processes in Task Manager"

echo ""
echo "🔄 If all else fails:"
echo "   1. Restart computer"
echo "   2. Connect printer AFTER browser is open"
echo "   3. Try WebUSB immediately before OS loads drivers"

echo ""
echo "✅ Run this script anytime you have WebUSB connection issues!"
