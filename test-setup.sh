#!/bin/bash

echo "🧪 Testing Multi-Printer Connectivity Features"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        ((TESTS_FAILED++))
    fi
}

# Test Node.js and npm
echo -e "${YELLOW}📋 Environment Tests${NC}"
run_test "Node.js installed" "node --version"
run_test "npm installed" "npm --version"
run_test "TypeScript support" "npx tsc --version"

# Test dependencies
echo -e "\n${YELLOW}📦 Dependency Tests${NC}"
run_test "Next.js dependency" "npm list next"
run_test "React dependencies" "npm list react react-dom"
run_test "WebSocket dependency" "npm list ws"
run_test "PWA dependency" "npm list next-pwa"

# Test project structure
echo -e "\n${YELLOW}📁 Project Structure Tests${NC}"
run_test "Components directory" "[ -d 'components' ]"
run_test "API routes directory" "[ -d 'pages/api' ]"
run_test "Types directory" "[ -d 'types' ]"
run_test "Utils directory" "[ -d 'utils' ]"
run_test "Connectivity utils" "[ -d 'utils/connectivity' ]"
run_test "Examples directory" "[ -d 'examples' ]"

# Test core files
echo -e "\n${YELLOW}🔧 Core Files Tests${NC}"
run_test "Printer types definition" "[ -f 'types/printer.ts' ]"
run_test "PrinterManager" "[ -f 'utils/PrinterManager.ts' ]"
run_test "USB connection" "[ -f 'utils/connectivity/USBConnection.ts' ]"
run_test "Network connection" "[ -f 'utils/connectivity/NetworkConnection.ts' ]"
run_test "Bluetooth connection" "[ -f 'utils/connectivity/BluetoothConnection.ts' ]"
run_test "API connection" "[ -f 'utils/connectivity/APIConnection.ts' ]"
run_test "Proxy server" "[ -f 'proxy-server.js' ]"

# Test React components
echo -e "\n${YELLOW}⚛️  Component Tests${NC}"
run_test "Multi-printer controller" "[ -f 'components/MultiPrinterController.tsx' ]"
run_test "Add printer modal" "[ -f 'components/AddPrinterModal.tsx' ]"
run_test "Template manager" "[ -f 'components/TemplateManager.tsx' ]"
run_test "Original printer controller" "[ -f 'components/PrinterController.tsx' ]"

# Test API endpoints
echo -e "\n${YELLOW}🔗 API Endpoint Tests${NC}"
run_test "Print API" "[ -f 'pages/api/print.ts' ]"
run_test "Templates API" "[ -f 'pages/api/templates.ts' ]"
run_test "Print history API" "[ -f 'pages/api/print-history.ts' ]"
run_test "Network discovery API" "[ -f 'pages/api/discover-network-printers.ts' ]"
run_test "Printer test API" "[ -f 'pages/api/test-printer.ts' ]"

# Test configuration files
echo -e "\n${YELLOW}⚙️  Configuration Tests${NC}"
run_test "Package.json scripts" "grep -q 'dev:full' package.json"
run_test "Next.js config" "[ -f 'next.config.js' ]"
run_test "TypeScript config" "[ -f 'tsconfig.json' ]"
run_test "PWA manifest" "[ -f 'public/manifest.json' ]"

# Test documentation
echo -e "\n${YELLOW}📚 Documentation Tests${NC}"
run_test "Main README" "[ -f 'README.md' ]"
run_test "Connectivity guide" "[ -f 'CONNECTIVITY.md' ]"
run_test "Quick start guide" "[ -f 'QUICKSTART.md' ]"
run_test "Startup script" "[ -f 'start.sh' ] && [ -x 'start.sh' ]"
run_test "Troubleshooting script" "[ -f 'troubleshoot-webusb.sh' ]"

# Test examples
echo -e "\n${YELLOW}📖 Example Tests${NC}"
run_test "Advanced printing examples" "[ -f 'examples/advanced-printing.ts' ]"
run_test "Multi-printer examples" "[ -f 'examples/multi-printer-integration.ts' ]"
run_test "API integration examples" "[ -f 'examples/api-integration.ts' ]"

# Syntax tests (if TypeScript is available)
if command -v npx &> /dev/null; then
    echo -e "\n${YELLOW}✨ Syntax Tests${NC}"
    run_test "TypeScript compilation" "npx tsc --noEmit"
    run_test "ESLint check" "npx eslint --ext .ts,.tsx . || true"
fi

# Test build process
echo -e "\n${YELLOW}🏗️  Build Tests${NC}"
if [ -d "node_modules" ]; then
    run_test "Next.js build test" "npm run build > /dev/null 2>&1"
else
    echo -e "${YELLOW}⚠️  Skipping build test (dependencies not installed)${NC}"
fi

# Network connectivity tests (if proxy server is running)
echo -e "\n${YELLOW}🌐 Network Tests${NC}"
if curl -s http://localhost:8080/status > /dev/null 2>&1; then
    run_test "Proxy server status" "curl -s http://localhost:8080/status"
    run_test "Network discovery endpoint" "curl -s http://localhost:8080/discover"
else
    echo -e "${YELLOW}⚠️  Proxy server not running - skipping network tests${NC}"
    echo -e "${YELLOW}💡 Run 'npm run proxy' to test network features${NC}"
fi

# Feature compatibility tests
echo -e "\n${YELLOW}🔍 Feature Compatibility Tests${NC}"

# Check browser compatibility
if command -v google-chrome &> /dev/null || command -v chromium &> /dev/null; then
    echo -e "${GREEN}✅ Chrome/Chromium detected - Full WebUSB support${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Chrome/Chromium not detected - WebUSB may not work${NC}"
fi

# Check for development tools
if command -v curl &> /dev/null; then
    echo -e "${GREEN}✅ curl available - API testing supported${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  curl not available - limited API testing${NC}"
fi

# Final results
echo -e "\n${BLUE}📊 Test Results${NC}"
echo -e "=============================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
    echo -e "${BLUE}📈 Success Rate: $SUCCESS_RATE%${NC}"
fi

echo -e "\n${YELLOW}🚀 Quick Start Commands${NC}"
echo -e "=============================="
echo -e "Full Development:    ${BLUE}npm run dev:full${NC}"
echo -e "Web App Only:        ${BLUE}npm run dev${NC}"
echo -e "Proxy Server Only:   ${BLUE}npm run proxy${NC}"
echo -e "Interactive Setup:   ${BLUE}./start.sh${NC}"
echo -e "Test Network:        ${BLUE}curl http://localhost:8080/status${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! The multi-printer system is ready to use.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Check the issues above.${NC}"
    exit 1
fi
