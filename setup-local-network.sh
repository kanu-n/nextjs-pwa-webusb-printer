#!/bin/bash

echo "🏠 Local Network Deployment Guide"
echo "================================="

echo "This solution deploys the app on your local network so all devices can access it."
echo ""

# Create local network deployment configuration
cat > local-network-deploy.sh << 'EOF'
#!/bin/bash

echo "🏠 Setting up Local Network Deployment"

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "📍 Detected local IP: $LOCAL_IP"

# Update proxy server for network access
sed -i "s/localhost/$LOCAL_IP/g" proxy-server.js

# Create environment for network deployment
cat > .env.local << ENV
NEXT_PUBLIC_PROXY_URL=http://$LOCAL_IP:8081
NODE_ENV=production
ENV

echo "✅ Configuration updated for local network deployment"
echo ""
echo "🚀 Starting services..."

# Build production
npm run build

# Start both services
echo "Starting web app on http://$LOCAL_IP:3000"
echo "Starting proxy server on http://$LOCAL_IP:8081"

# Run both services
npx concurrently \
  "PORT=3000 npm run start" \
  "PORT=8081 node proxy-server.js"
EOF

chmod +x local-network-deploy.sh

echo "✅ Local network deployment script created!"
echo ""
echo "📋 Next Steps:"
echo "1. Run: ./local-network-deploy.sh"
echo "2. Access from any device on your network"
echo "3. All devices will be able to print to network printers"
