#!/bin/bash
# Test ZO API seed endpoint (should work if app is registered)

ZO_CLIENT_KEY="1482d843137574f36f74"
BASE_URL="https://api.zo.xyz"

echo "🧪 Testing ZO API seed endpoint (should work if app is registered)..."
echo ""

curl -X GET "${BASE_URL}/api/v1/auth/application/seed/" \
  -H "client-key: ${ZO_CLIENT_KEY}" \
  -H "Platform: web" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -v 2>&1 | grep -A 20 "< HTTP"

echo ""
echo "✅ Test complete"

