#!/usr/bin/env node

/**
 * Automated console.log to devLog migration script
 * 
 * This script:
 * 1. Finds all TypeScript/TSX files with console statements
 * 2. Adds the devLog import if not present
 * 3. Replaces console.log/error/warn/info/debug with devLog equivalents
 * 4. Preserves code formatting
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to migrate
const srcDir = path.join(__dirname, '../apps/web/src');

// Files to exclude (already have custom logging or shouldn't be changed)
const excludePatterns = [
    '**/node_modules/**',
    '**/logger.ts', // The logger itself
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/.next/**',
];

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file has console statements
    if (!content.match(/console\.(log|error|warn|info|debug|table|group)/)) {
        return false;
    }

    // Add devLog import if not present
    if (!content.includes("from '@/lib/logger'")) {
        // Find the last import statement
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
        if (importLines.length > 0) {
            // Add after last import
            const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
            const insertPosition = lastImportIndex + importLines[importLines.length - 1].length;
            content = content.slice(0, insertPosition) +
                "\nimport { devLog } from '@/lib/logger';" +
                content.slice(insertPosition);
            modified = true;
        } else if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
            // Add after 'use client'
            const lines = content.split('\n');
            lines.splice(2, 0, "import { devLog } from '@/lib/logger';");
            content = lines.join('\n');
            modified = true;
        }
    }

    // Replace console statements
    const replacements = [
        { from: /console\.log\(/g, to: 'devLog.log(' },
        { from: /console\.error\(/g, to: 'devLog.error(' },
        { from: /console\.warn\(/g, to: 'devLog.warn(' },
        { from: /console\.info\(/g, to: 'devLog.info(' },
        { from: /console\.debug\(/g, to: 'devLog.debug(' },
        { from: /console\.table\(/g, to: 'devLog.table(' },
        { from: /console\.group\(/g, to: 'devLog.group(' },
        { from: /console\.groupEnd\(\)/g, to: 'devLog.groupEnd()' },
    ];

    for (const { from, to } of replacements) {
        if (content.match(from)) {
            content = content.replace(from, to);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

// Find all TS/TSX files
console.log('🔍 Finding files to migrate...\n');

const files = glob.sync(`${srcDir}/**/*.{ts,tsx}`, {
    ignore: excludePatterns,
});

console.log(`Found ${files.length} TypeScript files\n`);

let migratedCount = 0;
let skippedCount = 0;

for (const file of files) {
    const relativePath = path.relative(srcDir, file);

    if (migrateFile(file)) {
        console.log(`✅ Migrated: ${relativePath}`);
        migratedCount++;
    } else {
        skippedCount++;
    }
}

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Migrated: ${migratedCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files (no console statements)`);
console.log(`\n✨ Migration complete!`);
