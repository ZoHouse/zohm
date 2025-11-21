#!/bin/bash

# Quick test script for OTP verification
# Usage: ./scripts/test-verify-otp-quick.sh <OTP>

OTP=${1:-""}

if [ -z "$OTP" ]; then
  echo "❌ Please provide OTP as argument"
  echo "Usage: ./scripts/test-verify-otp-quick.sh <OTP>"
  exit 1
fi

echo "🧪 Testing OTP Verification"
echo "Phone: +918469964049"
echo "OTP: $OTP"
echo ""

curl -v -X POST "http://localhost:3001/api/zo/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"countryCode\": \"91\",
    \"phoneNumber\": \"8469964049\",
    \"otp\": \"$OTP\"
  }" | jq '.'

