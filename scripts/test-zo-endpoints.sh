#!/bin/bash
# Test different endpoint variations

ZO_CLIENT_KEY="1482d843137574f36f74"
BASE_URL="https://api.zo.xyz"

echo "🧪 Testing different ZO API endpoint variations..."
echo ""

# Test 1: Original endpoint
echo "Test 1: /api/v1/auth/login/mobile/otp/"
curl -s -X POST "${BASE_URL}/api/v1/auth/login/mobile/otp/" \
  -H "HTTP_CLIENT_KEY: ${ZO_CLIENT_KEY}" \
  -H "Platform: web" \
  -H "Content-Type: application/json" \
  -d '{"mobile_country_code":"91","mobile_number":"8469964049","message_channel":""}' \
  -w "\nStatus: %{http_code}\n" | head -5

echo ""
echo "---"
echo ""

# Test 2: Without /api/v1
echo "Test 2: /auth/login/mobile/otp/"
curl -s -X POST "${BASE_URL}/auth/login/mobile/otp/" \
  -H "HTTP_CLIENT_KEY: ${ZO_CLIENT_KEY}" \
  -H "Platform: web" \
  -H "Content-Type: application/json" \
  -d '{"mobile_country_code":"91","mobile_number":"8469964049","message_channel":""}' \
  -w "\nStatus: %{http_code}\n" | head -5

echo ""
echo "---"
echo ""

# Test 3: Check if API is accessible at all
echo "Test 3: GET /api/v1/auth/application/seed/ (should work)"
curl -s -X GET "${BASE_URL}/api/v1/auth/application/seed/" \
  -H "HTTP_CLIENT_KEY: ${ZO_CLIENT_KEY}" \
  -H "Platform: web" \
  -w "\nStatus: %{http_code}\n" | head -5

echo ""
echo "✅ Tests complete"

