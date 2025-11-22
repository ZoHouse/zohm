#!/bin/bash
# Test Avatar Generation via ZO API
# Usage: ./scripts/test-avatar-generation.sh

echo "🎨 ZO Avatar Generation Test Script"
echo "======================================"
echo ""

# Try to load from .env.local first
ENV_FILE="apps/web/.env.local"
if [ -f "$ENV_FILE" ]; then
  echo "📄 Found .env.local, loading credentials..."
  export $(grep -v '^#' "$ENV_FILE" | grep 'ZO_' | xargs)
fi

# Configuration - Pull from environment variables
ZO_TOKEN="${ZO_TOKEN:-}"
ZO_CLIENT_KEY="${ZO_CLIENT_KEY:-}"
ZO_DEVICE_ID="${ZO_DEVICE_ID:-}"
ZO_DEVICE_SECRET="${ZO_DEVICE_SECRET:-}"
ZO_API_BASE="${ZO_API_BASE:-https://api.io.zo.xyz}"

# Also try alternative env var names
ZO_TOKEN="${ZO_TOKEN:-${NEXT_PUBLIC_ZO_ACCESS_TOKEN:-}}"
ZO_CLIENT_KEY="${ZO_CLIENT_KEY:-${ZO_CLIENT_KEY_WEB:-}}"
ZO_API_BASE="${ZO_API_BASE:-${ZO_API_BASE_URL:-https://api.io.zo.xyz}}"

# Generate random device ID and secret if not provided
if [ -z "$ZO_DEVICE_ID" ]; then
  ZO_DEVICE_ID="test-device-$(uuidgen | tr '[:upper:]' '[:lower:]')"
  echo "📱 Generated random device ID: ${ZO_DEVICE_ID:0:30}..."
fi

if [ -z "$ZO_DEVICE_SECRET" ]; then
  ZO_DEVICE_SECRET="test-secret-$(uuidgen | tr '[:upper:]' '[:lower:]')"
  echo "🔐 Generated random device secret: ${ZO_DEVICE_SECRET:0:30}..."
fi

echo ""

# Check if credentials are set
if [ -z "$ZO_TOKEN" ] || [ -z "$ZO_CLIENT_KEY" ]; then
  echo "❌ Error: Missing ZO credentials"
  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  Option 1: Set environment variables                        │"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
  echo "export ZO_TOKEN='your-access-token'"
  echo "export ZO_CLIENT_KEY='your-client-key'"
  echo "# Device ID and secret are optional (will be generated)"
  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  Option 2: Add to apps/web/.env.local                       │"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
  echo "ZO_TOKEN=your-access-token"
  echo "ZO_CLIENT_KEY=your-client-key"
  echo "# ZO_DEVICE_ID and ZO_DEVICE_SECRET are optional"
  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  Option 3: Get from Browser localStorage                    │"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
  echo "1. Login to your app with ZO auth"
  echo "2. Open browser console (F12)"
  echo "3. Run these commands and copy the values:"
  echo ""
  echo "   localStorage.getItem('zo_access_token')"
  echo "   localStorage.getItem('zo_client_key')"
  echo ""
  echo "4. Then export them:"
  echo ""
  echo "   export ZO_TOKEN='<token-value>'"
  echo "   export ZO_CLIENT_KEY='<client-key-value>'"
  echo ""
  echo "   Note: Device ID and secret will be generated automatically"
  echo ""
  exit 1
fi

echo "🔑 Using credentials:"
echo "   Token: ${ZO_TOKEN:0:20}..."
echo "   Client Key: ${ZO_CLIENT_KEY:0:20}..."
echo "   API Base: $ZO_API_BASE"
echo ""

# Step 1: Update profile with body_type (triggers avatar generation)
echo "📡 Step 1: Updating profile to trigger avatar generation..."
echo ""

PROFILE_RESPONSE=$(curl -X POST "$ZO_API_BASE/api/v1/profile/me/" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $ZO_TOKEN" \
  -H "client-key: $ZO_CLIENT_KEY" \
  -H "client-device-id: $ZO_DEVICE_ID" \
  -H "client-device-secret: $ZO_DEVICE_SECRET" \
  -d '{
    "first_name": "CurlTestUser",
    "body_type": "bro"
  }' -s)

# Check if request succeeded
if echo "$PROFILE_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  FIRST_NAME=$(echo "$PROFILE_RESPONSE" | jq -r '.data.first_name')
  BODY_TYPE=$(echo "$PROFILE_RESPONSE" | jq -r '.data.body_type')
  AVATAR_IMAGE=$(echo "$PROFILE_RESPONSE" | jq -r '.data.avatar.image')
  
  echo "✅ Profile updated successfully!"
  echo "   Name: $FIRST_NAME"
  echo "   Body Type: $BODY_TYPE"
  echo "   Avatar: $AVATAR_IMAGE"
else
  echo "❌ Failed to update profile"
  echo ""
  echo "Response:"
  echo "$PROFILE_RESPONSE" | jq .
  echo ""
  exit 1
fi

echo ""
echo "🔍 Step 2: Polling for avatar generation..."
echo "   (Max 15 attempts, 2 second interval, 30 seconds total)"
echo ""

# Step 2: Poll for avatar completion
attempts=0
max_attempts=15

while [ $attempts -lt $max_attempts ]; do
  attempts=$((attempts + 1))
  echo "   📊 Attempt $attempts/$max_attempts..."
  
  # Fetch profile
  PROFILE_RESPONSE=$(curl -X GET "$ZO_API_BASE/api/v1/profile/me/" \
    -H "authorization: Bearer $ZO_TOKEN" \
    -H "client-key: $ZO_CLIENT_KEY" \
    -H "client-device-id: $ZO_DEVICE_ID" \
    -H "client-device-secret: $ZO_DEVICE_SECRET" \
    -s)
  
  # Extract avatar URL
  avatar_url=$(echo "$PROFILE_RESPONSE" | jq -r '.data.avatar.image')
  
  # Check if avatar is ready
  if [ "$avatar_url" != "null" ] && [ -n "$avatar_url" ] && [ "$avatar_url" != "" ]; then
    echo ""
    echo "✅ Avatar Ready!"
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "🎉 Success! Avatar generated in $((attempts * 2)) seconds"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "📷 Avatar URL:"
    echo "   $avatar_url"
    echo ""
    echo "💾 Full Profile Data:"
    echo "$PROFILE_RESPONSE" | jq '.data | {
      first_name,
      body_type,
      avatar: .avatar.image,
      place_name
    }'
    echo ""
    exit 0
  fi
  
  # Show status
  echo "      Status: Avatar still generating..."
  
  # Wait before next attempt
  if [ $attempts -lt $max_attempts ]; then
    sleep 2
  fi
done

# Timeout
echo ""
echo "⏱️ Timeout: Avatar generation took longer than 30 seconds"
echo ""
echo "💡 Possible reasons:"
echo "   - Backend is slow or under load"
echo "   - Avatar generation queue is full"
echo "   - Network issues"
echo ""
echo "🔄 You can try:"
echo "   1. Run this script again"
echo "   2. Check status manually:"
echo "      curl -X GET '$ZO_API_BASE/api/v1/profile/me/' \\"
echo "        -H 'authorization: Bearer \$ZO_TOKEN' \\"
echo "        -H 'client-key: \$ZO_CLIENT_KEY' | jq '.data.avatar'"
echo ""
exit 1

