#!/usr/bin/env node

/**
 * 🦄 Verify Privy Migration
 * 
 * This script checks if the migration was successful
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyMigration() {
  console.log('🔍 Verifying Privy Migration...\n');
  
  let allPassed = true;

  // Test 1: Check if new tables exist
  console.log('✓ Test 1: Checking new tables...');
  try {
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);
    const { data: wallets, error: walletsError } = await supabase.from('user_wallets').select('*').limit(1);
    const { data: authMethods, error: authError } = await supabase.from('user_auth_methods').select('*').limit(1);
    
    if (usersError || walletsError || authError) {
      console.log('  ❌ FAILED: Tables not found');
      console.log('     Users error:', usersError?.message);
      console.log('     Wallets error:', walletsError?.message);
      console.log('     Auth methods error:', authError?.message);
      allPassed = false;
    } else {
      console.log('  ✅ PASSED: All new tables exist\n');
    }
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    allPassed = false;
  }

  // Test 2: Count users
  console.log('✓ Test 2: Counting migrated users...');
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log(`  ✅ PASSED: ${count} users found in new table\n`);
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    allPassed = false;
  }

  // Test 3: Count wallets
  console.log('✓ Test 3: Counting migrated wallets...');
  try {
    const { count, error } = await supabase.from('user_wallets').select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log(`  ✅ PASSED: ${count} wallets found in new table\n`);
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    allPassed = false;
  }

  // Test 4: Check backward-compatible VIEW
  console.log('✓ Test 4: Checking backward-compatible VIEW...');
  try {
    const { data, error } = await supabase.from('members').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      console.log('  ✅ PASSED: members VIEW is working\n');
      console.log('  Sample member:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('  ⚠️  WARNING: members VIEW exists but has no data\n');
    }
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    allPassed = false;
  }

  // Test 5: Check if backup exists
  console.log('✓ Test 5: Checking if old table was backed up...');
  try {
    const { data, error } = await supabase.from('members_backup_pre_privy').select('*', { count: 'exact', head: true });
    if (error && error.code === 'PGRST204') {
      console.log('  ⚠️  WARNING: Backup table not found (might not have existed before)\n');
    } else if (error) {
      throw error;
    } else {
      console.log('  ✅ PASSED: Old members table backed up successfully\n');
    }
  } catch (error) {
    console.log('  ⚠️  WARNING: Could not check backup:', error.message, '\n');
  }

  // Summary
  console.log('═══════════════════════════════════════');
  if (allPassed) {
    console.log('✅ MIGRATION SUCCESSFUL! 🦄✨');
    console.log('═══════════════════════════════════════\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Test Privy login in your app');
    console.log('   2. Create a new user with email');
    console.log('   3. Check that profiles load correctly');
    console.log('   4. Update your code to use usePrivyUser hook\n');
  } else {
    console.log('⚠️  MIGRATION HAD ISSUES');
    console.log('═══════════════════════════════════════\n');
    console.log('Please check the errors above and re-run the migration if needed.\n');
  }
}

verifyMigration().catch(console.error);



