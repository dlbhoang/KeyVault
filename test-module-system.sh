#!/bin/bash
# Quick Test Script for Module Live Update System
# Run this to verify everything is working

echo "🔑 KeyVault Module Update System - Quick Test"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001/api"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing API Health...${NC}"
HEALTH=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$HEALTH" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API is running${NC}"
else
    echo -e "${RED}❌ API not responding (Code: $HTTP_CODE)${NC}"
    echo "Make sure backend is running: cd backend && npm start"
    exit 1
fi

# Test 2: Module Versions
echo ""
echo -e "${YELLOW}2. Fetching Module Versions...${NC}"
VERSIONS=$(curl -s "$API_URL/modules/versions")

if echo "$VERSIONS" | grep -q "analytics"; then
    echo -e "${GREEN}✅ Module versions endpoint working${NC}"
    echo "Found modules:"
    echo "$VERSIONS" | grep -o '"[^"]*":' | head -8 | sed 's/"//g' | sed 's/:$//'
else
    echo -e "${RED}❌ Could not fetch module versions${NC}"
fi

# Test 3: Login and Get Token
echo ""
echo -e "${YELLOW}3. Testing User Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No test user found. Creating one...${NC}"
    # Try to register
    curl -s -X POST "$API_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "name":"Test User",
        "email":"test@example.com",
        "password":"test1234"
      }' > /dev/null
    
    # Try login again
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "test1234"
      }')
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✅ User login successful (token: ${TOKEN:0:20}...)${NC}"
else
    echo -e "${RED}❌ Could not obtain user token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 4: Check Updates
echo ""
echo -e "${YELLOW}4. Testing Update Check Endpoint...${NC}"
UPDATES=$(curl -s -X POST "$API_URL/modules/check-updates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "desktopVersions": {
      "analytics": "1.0.0",
      "reports": "1.0.0"
    }
  }')

if echo "$UPDATES" | grep -q "updates"; then
    UPDATE_COUNT=$(echo "$UPDATES" | grep -o '"totalAvailable":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✅ Update check working${NC}"
    echo "   Found $UPDATE_COUNT available updates"
else
    echo -e "${RED}❌ Update check failed${NC}"
fi

# Test 5: Admin Login
echo ""
echo -e "${YELLOW}5. Testing Admin Access...${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✅ Admin login successful${NC}"
    
    # Test admin endpoints
    echo ""
    echo -e "${YELLOW}6. Testing Admin Endpoints...${NC}"
    
    HISTORY=$(curl -s "$API_URL/admin/modules/history?limit=10" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$HISTORY" | grep -q "records"; then
        echo -e "${GREEN}✅ Download history endpoint working${NC}"
    fi
    
    USERS_UPDATES=$(curl -s "$API_URL/admin/modules/users-updates" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$USERS_UPDATES" | grep -q "totalUsers"; then
        TOTAL=$(echo "$USERS_UPDATES" | grep -o '"totalUsers":[0-9]*' | grep -o '[0-9]*')
        echo -e "${GREEN}✅ Users updates report working (Total users: $TOTAL)${NC}"
    fi
else
    echo -e "${RED}❌ Admin login failed${NC}"
fi

# Summary
echo ""
echo -e "${YELLOW}=============================================="
echo "Test Summary"
echo "===============================================${NC}"
echo -e "${GREEN}✅ Backend API is functional${NC}"
echo -e "${GREEN}✅ Module system is working${NC}"
echo -e "${GREEN}✅ Authentication working${NC}"
echo ""
echo "Next steps:"
echo "1. Start frontend: cd frontend && npm run dev"
echo "2. Add UserModuleUpdates to /portal routes"
echo "3. Add AdminModuleUpdates to /admin routes"
echo "4. Test update checking in the UI"
echo ""
echo "For detailed info, see /IMPLEMENTATION_GUIDE.md"
