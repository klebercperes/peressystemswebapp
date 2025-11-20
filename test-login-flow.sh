#!/bin/bash
# Quick test script for login flow debugging

echo "=== 🔍 Testing Login Flow ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check services are running
echo "1️⃣ Checking services..."
if docker ps | grep -q "msp_backend"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    exit 1
fi

if docker ps | grep -q "msp_frontend"; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    exit 1
fi

if docker ps | grep -q "msp_nginx_proxy"; then
    echo -e "${GREEN}✅ Nginx proxy is running${NC}"
else
    echo -e "${RED}❌ Nginx proxy is NOT running${NC}"
    exit 1
fi

echo ""

# Test 2: Backend health check
echo "2️⃣ Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://peres.systems/api/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend health check: OK (200)${NC}"
else
    echo -e "${RED}❌ Backend health check failed: $HEALTH_RESPONSE${NC}"
fi

echo ""

# Test 3: Test login endpoint
echo "3️⃣ Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST https://peres.systems/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=kleber&password=SecurePass123" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Login endpoint: OK (200)${NC}"
    if echo "$BODY" | grep -q "access_token"; then
        echo -e "${GREEN}✅ Response contains access_token${NC}"
        TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$TOKEN" ]; then
            echo -e "${GREEN}✅ Token extracted successfully${NC}"
            echo -e "${YELLOW}   Token preview: ${TOKEN:0:20}...${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Response does not contain access_token${NC}"
        echo "   Response: $BODY"
    fi
else
    echo -e "${RED}❌ Login endpoint failed: $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi

echo ""

# Test 4: Test authenticated endpoint (if we got a token)
if [ "$HTTP_CODE" = "200" ] && [ -n "$TOKEN" ]; then
    echo "4️⃣ Testing authenticated endpoint with token..."
    AUTH_RESPONSE=$(curl -s -X GET https://peres.systems/api/clients \
      -H "Authorization: Bearer $TOKEN" \
      -w "\n%{http_code}")
    
    AUTH_HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -1)
    AUTH_BODY=$(echo "$AUTH_RESPONSE" | head -n -1)
    
    if [ "$AUTH_HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Authenticated request: OK (200)${NC}"
        CLIENT_COUNT=$(echo "$AUTH_BODY" | grep -o '"id"' | wc -l)
        echo -e "${GREEN}✅ Found $CLIENT_COUNT clients${NC}"
    else
        echo -e "${RED}❌ Authenticated request failed: $AUTH_HTTP_CODE${NC}"
        echo "   Response: $AUTH_BODY"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping authenticated endpoint test (no token)${NC}"
fi

echo ""

# Test 5: Check backend logs for recent errors
echo "5️⃣ Checking backend logs for errors (last 20 lines)..."
RECENT_ERRORS=$(docker logs --tail 20 msp_backend 2>&1 | grep -i "error\|exception\|traceback" | tail -5)
if [ -z "$RECENT_ERRORS" ]; then
    echo -e "${GREEN}✅ No recent errors in backend logs${NC}"
else
    echo -e "${YELLOW}⚠️  Recent errors found:${NC}"
    echo "$RECENT_ERRORS"
fi

echo ""

# Summary
echo "=== 📊 Summary ==="
echo ""
echo "Next steps for browser testing:"
echo "1. Open https://peres.systems in your browser"
echo "2. Press F12 to open DevTools"
echo "3. Go to Network tab and filter by 'XHR'"
echo "4. Try to login with: kleber / SecurePass123"
echo "5. Check:"
echo "   - Login request returns 200"
echo "   - Token is stored in Local Storage (Application tab)"
echo "   - Subsequent API calls include Authorization header"
echo ""
echo "For detailed debugging, see: DEBUGGING_GUIDE.md"

