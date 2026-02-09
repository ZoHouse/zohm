#!/bin/bash
# Download ALL CAS Users - Background Runner
# 
# This script downloads all 650K+ users from CAS API
# Estimated time: ~55 minutes at 200 users/sec
#
# Usage:
#   ./scripts/run-download.sh
#
# To monitor progress:
#   tail -f apps/web/scripts/download.log

cd "$(dirname "$0")/.."

# Credentials — set these as environment variables before running:
#   export CAS_ADMIN_TOKEN="your-token"
#   export CAS_DEVICE_ID="your-device-id"
#   export CAS_DEVICE_SECRET="your-device-secret"
#
# Or store them in apps/web/.env.local (already gitignored)

if [ -z "$CAS_ADMIN_TOKEN" ] || [ -z "$CAS_DEVICE_ID" ] || [ -z "$CAS_DEVICE_SECRET" ]; then
  echo "❌ Missing CAS credentials. Set these env vars before running:"
  echo "   export CAS_ADMIN_TOKEN=..."
  echo "   export CAS_DEVICE_ID=..."
  echo "   export CAS_DEVICE_SECRET=..."
  exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "   📥 Starting CAS User Download"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📂 Output: apps/web/data/cas-users-complete-$(date +%Y-%m-%d).json"
echo "📝 Log:    apps/web/scripts/download.log"
echo ""
echo "⏱️  Estimated time: ~55 minutes for 650K users"
echo ""
echo "To monitor progress:"
echo "   tail -f apps/web/scripts/download.log"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Run the download (in foreground so you can see progress)
npx tsx scripts/download-cas-users.ts 2>&1 | tee scripts/download.log
