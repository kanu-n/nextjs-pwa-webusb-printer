#!/bin/bash

echo "🚀 Setting up Next.js PWA WebUSB Printer Project..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎨 Generating placeholder icons..."
./generate-icons.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "The app will be available at http://localhost:3000"
echo ""
echo "For production build:"
echo "  npm run build"
echo "  npm run start"
