#!/bin/bash

echo "🌐 Network Deployment Manager"
echo "============================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo -e "${BLUE}📍 Detected local IP: $LOCAL_IP${NC}"
echo ""

echo "Select action:"
echo "1. Start Network Services"
echo "2. Stop Network Services" 
echo "3. Restart Network Services"
echo "4. Check Service Status"
echo "5. Test Printer Connection"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}🚀 Starting network services...${NC}"
        
        # Build if needed
        if [ ! -d ".next" ]; then
            echo "📦 Building application..."
            npm run build
        fi
        
        # Start services
        echo -e "${BLUE}Starting web app on http://$LOCAL_IP:3000${NC}"
        echo -e "${BLUE}Starting proxy server on http://$LOCAL_IP:8081${NC}"
        
        # Start in background
        HOST=0.0.0.0 PORT=3000 npm run start > web-app.log 2>&1 &
        WEB_PID=$!
        echo $WEB_PID > web-app.pid
        
        PORT=8081 node proxy-server.js > proxy-server.log 2>&1 &
        PROXY_PID=$!
        echo $PROXY_PID > proxy-server.pid
        
        sleep 3
        
        echo -e "${GREEN}✅ Services started!${NC}"
        echo -e "${BLUE}🌐 Web App: http://$LOCAL_IP:3000${NC}"
        echo -e "${BLUE}🖨️  Proxy: http://$LOCAL_IP:8081${NC}"
        echo ""
        echo "Share these URLs with devices on your network!"
        ;;
        
    2)
        echo -e "${YELLOW}🛑 Stopping network services...${NC}"
        
        if [ -f "web-app.pid" ]; then
            kill $(cat web-app.pid) 2>/dev/null
            rm web-app.pid
            echo "Web app stopped"
        fi
        
        if [ -f "proxy-server.pid" ]; then
            kill $(cat proxy-server.pid) 2>/dev/null
            rm proxy-server.pid
            echo "Proxy server stopped"
        fi
        
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
        
    3)
        echo -e "${YELLOW}🔄 Restarting network services...${NC}"
        
        # Stop first
        if [ -f "web-app.pid" ]; then
            kill $(cat web-app.pid) 2>/dev/null
            rm web-app.pid
        fi
        
        if [ -f "proxy-server.pid" ]; then
            kill $(cat proxy-server.pid) 2>/dev/null
            rm proxy-server.pid
        fi
        
        sleep 2
        
        # Rebuild
        echo "📦 Rebuilding..."
        npm run build
        
        # Start again
        HOST=0.0.0.0 PORT=3000 npm run start > web-app.log 2>&1 &
        echo $! > web-app.pid
        
        PORT=8081 node proxy-server.js > proxy-server.log 2>&1 &
        echo $! > proxy-server.pid
        
        sleep 3
        
        echo -e "${GREEN}✅ Services restarted!${NC}"
        echo -e "${BLUE}🌐 Web App: http://$LOCAL_IP:3000${NC}"
        echo -e "${BLUE}🖨️  Proxy: http://$LOCAL_IP:8081${NC}"
        ;;
        
    4)
        echo -e "${BLUE}📊 Service Status:${NC}"
        echo ""
        
        # Check web app
        if [ -f "web-app.pid" ] && kill -0 $(cat web-app.pid) 2>/dev/null; then
            echo -e "${GREEN}✅ Web App: Running (PID: $(cat web-app.pid))${NC}"
            echo "   URL: http://$LOCAL_IP:3000"
        else
            echo -e "${RED}❌ Web App: Not running${NC}"
        fi
        
        # Check proxy server
        if [ -f "proxy-server.pid" ] && kill -0 $(cat proxy-server.pid) 2>/dev/null; then
            echo -e "${GREEN}✅ Proxy Server: Running (PID: $(cat proxy-server.pid))${NC}"
            echo "   URL: http://$LOCAL_IP:8081"
        else
            echo -e "${RED}❌ Proxy Server: Not running${NC}"
        fi
        
        # Test connectivity
        echo ""
        echo "Testing connectivity..."
        if curl -s http://$LOCAL_IP:3000 > /dev/null; then
            echo -e "${GREEN}✅ Web app accessible${NC}"
        else
            echo -e "${RED}❌ Web app not accessible${NC}"
        fi
        
        if curl -s http://$LOCAL_IP:8081/status > /dev/null; then
            echo -e "${GREEN}✅ Proxy server accessible${NC}"
        else
            echo -e "${RED}❌ Proxy server not accessible${NC}"
        fi
        ;;
        
    5)
        echo -e "${BLUE}🧪 Testing printer connection...${NC}"
        echo ""
        
        read -p "Enter printer IP (default: 192.168.0.130): " PRINTER_IP
        PRINTER_IP=${PRINTER_IP:-192.168.0.130}
        
        read -p "Enter printer port (default: 9100): " PRINTER_PORT
        PRINTER_PORT=${PRINTER_PORT:-9100}
        
        echo "Testing connection to $PRINTER_IP:$PRINTER_PORT..."
        
        RESULT=$(curl -s -X POST http://$LOCAL_IP:8081/test \
            -H "Content-Type: application/json" \
            -d "{\"ip\":\"$PRINTER_IP\",\"port\":$PRINTER_PORT}")
        
        if echo "$RESULT" | grep -q '"online":true'; then
            RESPONSE_TIME=$(echo "$RESULT" | grep -o '"responseTime":[0-9]*' | cut -d':' -f2)
            echo -e "${GREEN}✅ Printer is online!${NC}"
            echo "   Response time: ${RESPONSE_TIME}ms"
            echo ""
            echo "🎯 Ready to add printer in web interface:"
            echo "   1. Open: http://$LOCAL_IP:3000"
            echo "   2. Go to Multi-Printer interface"
            echo "   3. Add printer: IP=$PRINTER_IP, Port=$PRINTER_PORT"
        else
            echo -e "${RED}❌ Printer is offline or unreachable${NC}"
            echo "   Check printer IP and network connection"
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}💡 Tip: Services will run in background. Use option 4 to check status.${NC}"
