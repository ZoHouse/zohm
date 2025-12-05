#!/bin/bash

# Automated console.log to devLog migration
# This script migrates ALL TypeScript files in src/

set -e

SRC_DIR="apps/web/src"
COUNT=0

echo "🚀 Starting console.log → devLog migration"
echo "Directory: $SRC_DIR"
echo ""

# Find all TS/TSX files with console statements
FILES=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -name "logger.ts" -exec grep -l "console\." {} \;)

for FILE in $FILES; do
  RELATIVE=$(echo "$FILE" | sed "s|^$SRC_DIR/||")
  
  # Check if already has devLog import
  if grep -q "from '@/lib/logger'" "$FILE"; then
    echo "⏭️  Already migrated: $RELATIVE"
    continue
  fi
  
  echo "📝 Migrating: $RELATIVE"
  
  # Create backup
  cp "$FILE" "$FILE.bak"
  
  # Add import after existing imports
  if grep -q "^import " "$FILE"; then
    # Find last import line number
    LAST_IMPORT=$(grep -n "^import " "$FILE" | tail -1 | cut -d: -f1)
    
    # Insert devLog import after last import
    sed -i "${LAST_IMPORT}a import { devLog } from '@/lib/logger';" "$FILE"
  elif head -1 "$FILE" | grep -q "'use client'"; then
    # Add after 'use client'
    sed -i "2a\\import { devLog } from '@/lib/logger';" "$FILE"
  fi
  
  # Replace console statements
  sed -i 's/console\.log(/devLog.log(/g' "$FILE"
  sed -i 's/console\.error(/devLog.error(/g' "$FILE"
  sed -i 's/console\.warn(/devLog.warn(/g' "$FILE"
  sed -i 's/console\.info(/devLog.info(/g' "$FILE"
  sed -i 's/console\.debug(/devLog.debug(/g' "$FILE"
  sed -i 's/console\.table(/devLog.table(/g' "$FILE"
  sed -i 's/console\.group(/devLog.group(/g' "$FILE"
  sed -i 's/console\.groupEnd()/devLog.groupEnd()/g' "$FILE"
  
  # Remove backup if successful
  rm "$FILE.bak"
  
  COUNT=$((COUNT + 1))
done

echo ""
echo "✅ Migration complete!"
echo "📊 Migrated $COUNT files"
echo ""
echo "🧪 Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test in development: pnpm run dev"
echo "  3. Verify clean console in production"
