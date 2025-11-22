#!/bin/bash
# Direct test of ZO API OTP endpoint

ZO_CLIENT_KEY="1482d843137574f36f74"
BASE_URL="https://api.zo.xyz"
ENDPOINT="/api/v1/auth/login/mobile/otp/"

echo "🧪 Testing ZO API OTP endpoint directly..."
echo ""
echo "Full URL: ${BASE_URL}${ENDPOINT}"
echo "Client Key: ${ZO_CLIENT_KEY:0:10}..."
echo ""

curl -X POST "${BASE_URL}${ENDPOINT}" \
  -H "HTTP_CLIENT_KEY: ${ZO_CLIENT_KEY}" \
  -H "Platform: web" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "mobile_country_code": "91",
    "mobile_number": "8469964049",
    "message_channel": ""
  }' \
  -v

echo ""
echo ""
echo "✅ Test complete. Check the response above."

