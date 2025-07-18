#!/bin/bash

echo "🚀 Starting Next.js PWA Multi-Connectivity Thermal Printer"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    
    echo "✅ Dependencies installed successfully"
else
    echo "📦 Dependencies already installed"
fi

# Create logs directory
mkdir -p logs

echo ""
echo "🔧 Available startup options:"
echo "1. Full Development (Web App + Proxy Server)"
echo "2. Web App Only"
echo "3. Proxy Server Only"
echo "4. Production Build"
echo "5. Production Start (Full)"
echo ""

read -p "Select option (1-5): " option

case $option in
    1)
        echo "🌐 Starting Full Development Environment..."
        echo "📱 Web App: http://localhost:3000"
        echo "🖨️  Proxy Server: http://localhost:8080"
        echo ""
        echo "Press Ctrl+C to stop both services"
        npm run dev:full
        ;;
    2)
        echo "📱 Starting Web App Only..."
        echo "🌐 Access at: http://localhost:3000"
        npm run dev
        ;;
    3)
        echo "🖨️  Starting Proxy Server Only..."
        echo "🌐 Access at: http://localhost:8080"
        npm run proxy
        ;;
    4)
        echo "🏗️  Building for production..."
        npm run build
        
        if [ $? -eq 0 ]; then
            echo "✅ Build completed successfully"
            echo "💡 Run option 5 to start production server"
        else
            echo "❌ Build failed"
            exit 1
        fi
        ;;
    5)
        echo "🚀 Starting Production Environment..."
        echo "📱 Web App: http://localhost:3000"
        echo "🖨️  Proxy Server: http://localhost:8080"
        
        # Check if build exists
        if [ ! -d ".next" ]; then
            echo "⚠️  No production build found. Building first..."
            npm run build
            
            if [ $? -ne 0 ]; then
                echo "❌ Build failed"
                exit 1
            fi
        fi
        
        npm run start:full
        ;;
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo "👋 Thanks for using the Thermal Printer PWA!"
