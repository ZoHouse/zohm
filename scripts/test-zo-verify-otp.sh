#!/bin/bash

# Test ZO API OTP Verification
# Usage: ./scripts/test-zo-verify-otp.sh <country_code> <phone_number> <otp>

COUNTRY_CODE=${1:-"91"}
PHONE_NUMBER=${2:-"8469964049"}
OTP=${3:-"123456"}

# Generate random device credentials (as per ZO API spec)
DEVICE_ID="web-$(date +%s)-$(openssl rand -hex 4)"
DEVICE_SECRET="$(openssl rand -hex 16)"

echo "🧪 Testing ZO API OTP Verification"
echo "=================================="
echo "Country Code: $COUNTRY_CODE"
echo "Phone Number: $PHONE_NUMBER"
echo "OTP: $OTP"
echo "Device ID: $DEVICE_ID"
echo "Device Secret: $DEVICE_SECRET"
echo ""

# Test direct ZO API call
echo "📤 Step 1: Direct ZO API Call"
echo "-----------------------------"
curl -v -X POST "https://api.io.zo.xyz/api/v1/auth/login/mobile/" \
  -H "client-key: 1482d843137574f36f74" \
  -H "client-device-id: $DEVICE_ID" \
  -H "client-device-secret: $DEVICE_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"mobile_country_code\": \"$COUNTRY_CODE\",
    \"mobile_number\": \"$PHONE_NUMBER\",
    \"otp\": \"$OTP\"
  }" | jq '.'

echo ""
echo ""
echo "📤 Step 2: Next.js API Route Call"
echo "----------------------------------"
curl -v -X POST "http://localhost:3001/api/zo/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"countryCode\": \"$COUNTRY_CODE\",
    \"phoneNumber\": \"$PHONE_NUMBER\",
    \"otp\": \"$OTP\"
  }" | jq '.'

