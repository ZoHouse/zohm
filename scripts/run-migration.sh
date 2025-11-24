#!/bin/bash

# 🦄 Run Privy Migration Script
# This script executes the migration by breaking it into smaller chunks

set -e

echo "🦄 Privy Migration Runner"
echo "=========================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check credentials
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Missing Supabase credentials!"
  echo "   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
  exit 1
fi

PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/([^.]+)\.supabase\.co/\1/')

echo "🔗 Supabase Project: $PROJECT_REF"
echo ""
echo "📋 Unfortunately, running large SQL migrations via API is not supported."
echo "   The safest way is to use the Supabase Dashboard."
echo ""
echo "✨ Opening Supabase SQL Editor for you..."
echo ""
echo "📝 Steps to complete the migration:"
echo "   1. The SQL Editor should open in your browser"
echo "   2. Click 'New Query' in the left sidebar"
echo "   3. Copy the contents of: migrations/001_privy_migration.sql"
echo "   4. Paste into the editor"
echo "   5. Click 'Run' (or press Cmd+Enter)"
echo "   6. Wait for success message (30-60 seconds)"
echo ""
echo "🔗 SQL Editor URL:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""

# Try to open in browser
if command -v open &> /dev/null; then
  # macOS
  open "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
  echo "✅ Opened in your default browser!"
elif command -v xdg-open &> /dev/null; then
  # Linux
  xdg-open "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
  echo "✅ Opened in your default browser!"
else
  echo "⚠️  Could not auto-open browser. Please visit the URL above manually."
fi

echo ""
echo "📄 Migration file to copy:"
echo "   $(pwd)/migrations/001_privy_migration.sql"
echo ""
echo "💡 Tip: Use Cmd+A to select all, then Cmd+C to copy the migration file"
echo ""



