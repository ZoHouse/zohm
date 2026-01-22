#!/usr/bin/env node

/**
 * 🦄 Run Any Migration
 *
 * Usage: node scripts/run-any-migration.js <migration-filename>
 * Example: node scripts/run-any-migration.js 20260123-add-pending-rsvp-status.sql
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Get migration filename from command line args
const migrationFilename = process.argv[2];

if (!migrationFilename) {
  console.error('❌ Error: Please provide a migration filename');
  console.error('   Usage: node scripts/run-any-migration.js <migration-filename>');
  console.error('   Example: node scripts/run-any-migration.js 20260123-add-pending-rsvp-status.sql');
  process.exit(1);
}

// Load environment variables manually (no dotenv dependency)
function loadEnvFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (e) {
    // File doesn't exist, skip
  }
}

loadEnvFile(path.join(__dirname, '../apps/web/.env.local'));
loadEnvFile(path.join(__dirname, '../.env.local'));
loadEnvFile(path.join(__dirname, '../.env'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Read the migration SQL file
const migrationPath = path.join(__dirname, 'migrations', migrationFilename);
let migrationSQL;

try {
  migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Loaded migration SQL file:', migrationFilename);
  console.log(`   File size: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  console.error('   Looking for:', migrationPath);
  process.exit(1);
}

// Extract the project reference from the URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
console.log(`\n🔗 Connecting to Supabase project: ${projectRef}`);

// Execute SQL via Supabase REST API
const postData = JSON.stringify({ query: migrationSQL });

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
};

console.log('\n🚀 Running migration...');
console.log('   This may take 30-60 seconds...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration completed successfully!');
      console.log('\n📊 Results:');
      try {
        const result = JSON.parse(data);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.log(data);
      }

      console.log('\n✅ Migration applied:', migrationFilename);

      process.exit(0);
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`);
      console.error('Response:', data);

      console.log('\n💡 Alternative: Run migration in Supabase Dashboard');
      console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql');
      console.log('   2. Click "New Query"');
      console.log('   3. Copy contents of: scripts/migrations/' + migrationFilename);
      console.log('   4. Paste and click "Run"');

      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error executing migration:', error.message);

  console.log('\n💡 Alternative: Run migration in Supabase Dashboard');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql');
  console.log('   2. Click "New Query"');
  console.log('   3. Copy contents of: scripts/migrations/' + migrationFilename);
  console.log('   4. Paste and click "Run"');

  process.exit(1);
});

req.write(postData);
req.end();
