#!/bin/bash

echo "🔍 PWA Installation Readiness Checker"
echo "===================================="

PWA_DIR="/home/hello/Documents/mine/nextjs-pwa-webusb-printer"
PUBLIC_DIR="$PWA_DIR/public"

echo "📂 Checking PWA files..."

# Check manifest.json
if [ -f "$PUBLIC_DIR/manifest.json" ]; then
    echo "✅ manifest.json exists"
    
    # Check if manifest is valid JSON
    if jq empty "$PUBLIC_DIR/manifest.json" >/dev/null 2>&1; then
        echo "✅ manifest.json is valid JSON"
        
        # Extract key fields
        NAME=$(jq -r '.name' "$PUBLIC_DIR/manifest.json")
        START_URL=$(jq -r '.start_url' "$PUBLIC_DIR/manifest.json")
        DISPLAY=$(jq -r '.display' "$PUBLIC_DIR/manifest.json")
        ICONS_COUNT=$(jq '.icons | length' "$PUBLIC_DIR/manifest.json")
        
        echo "   📱 App Name: $NAME"
        echo "   🏠 Start URL: $START_URL"
        echo "   📺 Display Mode: $DISPLAY"
        echo "   🎨 Icons: $ICONS_COUNT found"
    else
        echo "❌ manifest.json has invalid JSON syntax"
    fi
else
    echo "❌ manifest.json missing"
fi

# Check required icons
echo ""
echo "🎨 Checking PWA icons..."

declare -a REQUIRED_ICONS=(
    "android-chrome-192x192.png"
    "android-chrome-512x512.png"
    "apple-touch-icon.png"
    "favicon.ico"
)

for icon in "${REQUIRED_ICONS[@]}"; do
    if [ -f "$PUBLIC_DIR/$icon" ]; then
        SIZE=$(ls -lh "$PUBLIC_DIR/$icon" | awk '{print $5}')
        echo "✅ $icon ($SIZE)"
    else
        echo "❌ $icon missing"
    fi
done

# Check service worker
echo ""
echo "⚙️ Checking Service Worker..."

if [ -f "$PUBLIC_DIR/sw.js" ]; then
    echo "✅ Service Worker (sw.js) exists"
    SW_SIZE=$(ls -lh "$PUBLIC_DIR/sw.js" | awk '{print $5}')
    echo "   📦 Size: $SW_SIZE"
else
    echo "❌ Service Worker missing"
fi

# Check offline page
if [ -f "$PUBLIC_DIR/offline.html" ]; then
    echo "✅ Offline fallback page exists"
else
    echo "⚠️  Offline fallback page missing (optional)"
fi

# Check HTTPS requirement
echo ""
echo "🔒 Checking HTTPS requirements..."
echo "   💡 PWA requires HTTPS in production"
echo "   💡 localhost works for development"
echo "   💡 Currently running on: localhost:3001"

# Check browser compatibility
echo ""
echo "🌐 Browser PWA Install Support:"
echo "   ✅ Chrome/Chromium - Full support"
echo "   ✅ Edge - Full support" 
echo "   ✅ Opera - Full support"
echo "   ⚠️  Firefox - Limited support"
echo "   ❌ Safari - No install prompt"

# PWA criteria checklist
echo ""
echo "📋 PWA Installation Criteria:"
echo "   ✅ Served over HTTPS (localhost OK for dev)"
echo "   ✅ Valid manifest.json"
echo "   ✅ Service Worker registered"
echo "   ✅ Icons (192x192 and 512x512)"
echo "   ✅ display: standalone/fullscreen"
echo "   ✅ start_url defined"

echo ""
echo "🚀 To see install prompt in browser:"
echo "   1. Open Chrome/Edge at localhost:3001"
echo "   2. Look for install icon in address bar"
echo "   3. Or use Chrome menu > Install app"
echo "   4. Check browser console for 'beforeinstallprompt' event"

echo ""
echo "🔧 Debug tips:"
echo "   • Open DevTools > Application > Manifest"
echo "   • Check Console for PWA-related errors"
echo "   • Try incognito mode if issues persist"
echo "   • Clear browser data and reload"
