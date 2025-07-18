#!/bin/bash

echo "🚀 Multi-Printer PWA Deployment Script"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Available deployment options:${NC}"
echo "1. Vercel (Recommended for web app)"
echo "2. Netlify (Alternative hosting)"
echo "3. Railway (Full-stack with proxy server)"
echo "4. Generate Docker setup"
echo "5. Create production environment files"
echo ""

read -p "Select deployment option (1-5): " option

case $option in
    1)
        echo -e "${YELLOW}🌐 Deploying to Vercel...${NC}"
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        echo -e "${BLUE}📝 Setting up Vercel configuration...${NC}"
        
        # Create environment variables file
        cat > .env.production << EOF
NEXT_PUBLIC_PROXY_URL=http://localhost:8080
NEXT_PUBLIC_DEPLOYMENT_TYPE=vercel
EOF
        
        echo -e "${GREEN}✅ Environment configured${NC}"
        echo -e "${BLUE}🚀 Starting Vercel deployment...${NC}"
        
        # Deploy to Vercel
        vercel --prod
        
        echo -e "${GREEN}✅ Vercel deployment complete!${NC}"
        echo -e "${YELLOW}⚠️  Note: Network printing requires local proxy server${NC}"
        echo -e "${BLUE}💡 Run 'npm run proxy' locally for network printer support${NC}"
        ;;
        
    2)
        echo -e "${YELLOW}🌐 Setting up Netlify deployment...${NC}"
        
        # Create Netlify configuration
        cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  
[functions]
  node_bundler = "esbuild"
EOF

        # Create environment file
        cat > .env.production << EOF
NEXT_PUBLIC_PROXY_URL=http://localhost:8080
NEXT_PUBLIC_DEPLOYMENT_TYPE=netlify
EOF
        
        echo -e "${GREEN}✅ Netlify configuration created${NC}"
        echo -e "${BLUE}📝 Next steps:${NC}"
        echo "1. Push to GitHub"
        echo "2. Connect repository to Netlify"
        echo "3. Deploy automatically"
        ;;
        
    3)
        echo -e "${YELLOW}🚂 Setting up Railway deployment...${NC}"
        
        # Create Railway configuration
        cat > railway.toml << EOF
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "npm run start:full"

[[services]]
  name = "web-app"
  
[[services]]
  name = "proxy-server"
  startCommand = "node proxy-server.js"
EOF

        # Create Docker setup for Railway
        cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
EXPOSE 8080

CMD ["npm", "run", "start:full"]
EOF

        echo -e "${GREEN}✅ Railway configuration created${NC}"
        echo -e "${BLUE}📝 Next steps:${NC}"
        echo "1. Install Railway CLI: npm install -g @railway/cli"
        echo "2. Login: railway login"
        echo "3. Deploy: railway up"
        ;;
        
    4)
        echo -e "${YELLOW}🐳 Creating Docker setup...${NC}"
        
        # Create production Dockerfile
        cat > Dockerfile << EOF
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/proxy-server.js ./proxy-server.js

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000
EXPOSE 8080

CMD ["npm", "run", "start:full"]
EOF

        # Create docker-compose
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  thermal-printer-app:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_PROXY_URL=http://localhost:8080
    networks:
      - printer-network
    restart: unless-stopped

networks:
  printer-network:
    driver: bridge
EOF

        # Create .dockerignore
        cat > .dockerignore << EOF
.next
node_modules
.git
.gitignore
README.md
Dockerfile
.dockerignore
npm-debug.log
EOF

        echo -e "${GREEN}✅ Docker configuration created${NC}"
        echo -e "${BLUE}📝 To deploy with Docker:${NC}"
        echo "1. Build: docker build -t thermal-printer-pwa ."
        echo "2. Run: docker-compose up -d"
        echo "3. Access: http://localhost:3000"
        ;;
        
    5)
        echo -e "${YELLOW}⚙️  Creating production environment files...${NC}"
        
        # Create production environment
        cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production

# Proxy Server Configuration
NEXT_PUBLIC_PROXY_URL=http://localhost:8080
PROXY_PORT=8080

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com

# PWA Configuration
NEXT_PUBLIC_APP_NAME="Thermal Printer PWA"
NEXT_PUBLIC_APP_DESCRIPTION="Multi-connectivity thermal printer control"

# Deployment Type
NEXT_PUBLIC_DEPLOYMENT_TYPE=production
EOF

        # Create staging environment
        cat > .env.staging << EOF
# Staging Environment Configuration
NODE_ENV=development

# Proxy Server Configuration
NEXT_PUBLIC_PROXY_URL=http://localhost:8080
PROXY_PORT=8080

# API Configuration
NEXT_PUBLIC_API_URL=https://staging.your-domain.com

# PWA Configuration
NEXT_PUBLIC_APP_NAME="Thermal Printer PWA (Staging)"
NEXT_PUBLIC_APP_DESCRIPTION="Multi-connectivity thermal printer control - Staging"

# Deployment Type
NEXT_PUBLIC_DEPLOYMENT_TYPE=staging
EOF

        # Create deployment script
        cat > deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Production Deployment Script"

# Load environment
source .env.production

# Build application
echo "📦 Building application..."
npm run build

# Start services
echo "🎯 Starting production services..."
npm run start:full

echo "✅ Deployment complete!"
echo "🌐 Web App: http://localhost:3000"
echo "🖨️  Proxy Server: http://localhost:8080"
EOF

        chmod +x deploy.sh

        echo -e "${GREEN}✅ Environment files created${NC}"
        echo -e "${BLUE}📝 Files created:${NC}"
        echo "- .env.production"
        echo "- .env.staging"
        echo "- deploy.sh"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Important Notes for Production:${NC}"
echo "======================================"
echo -e "${BLUE}🔒 HTTPS Required:${NC} WebUSB needs HTTPS in production"
echo -e "${BLUE}🌐 Network Printing:${NC} Proxy server must be on same network as printers"
echo -e "${BLUE}📱 PWA Features:${NC} Will work offline after first load"
echo -e "${BLUE}🔗 API Integration:${NC} Works from any deployment"
echo -e "${BLUE}📶 Bluetooth:${NC} Requires experimental flags in some browsers"
echo ""
echo -e "${GREEN}🚀 Ready to deploy!${NC}"
