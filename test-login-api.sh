#!/bin/bash
# Test login API from browser perspective

echo "Testing login API with CORS headers..."
echo ""

# Simulate browser request with Origin header
curl -k -X POST https://peres.systems/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Origin: https://peres.systems" \
  -d "username=kleber&password=SecurePass123" \
  -v 2>&1 | grep -E "(HTTP|Access-Control|token|error)" | head -10

echo ""
echo "If you see 'Access-Control-Allow-Origin: https://peres.systems', CORS is working!"
