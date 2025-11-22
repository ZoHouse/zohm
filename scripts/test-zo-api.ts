#!/usr/bin/env tsx
/**
 * ZO API Test Script
 * 
 * Tests the ZO API connection and authentication
 * Usage: tsx scripts/test-zo-api.ts
 */

const ZO_API_BASE_URL = process.env.ZO_API_BASE_URL || 'https://api.zo.xyz';
const ZO_CLIENT_KEY_WEB = process.env.ZO_CLIENT_KEY_WEB;

console.log('🧪 Testing ZO API Connection...\n');
console.log('Configuration:');
console.log('  Base URL:', ZO_API_BASE_URL);
console.log('  Client Key:', ZO_CLIENT_KEY_WEB ? `${ZO_CLIENT_KEY_WEB.substring(0, 8)}...` : '❌ MISSING');
console.log('');

if (!ZO_CLIENT_KEY_WEB) {
  console.error('❌ Error: ZO_CLIENT_KEY_WEB not found in environment variables');
  console.error('   Please add it to your .env.local file');
  process.exit(1);
}

// Test 1: Health check or basic endpoint without auth
async function testBasicConnection() {
  console.log('📡 Test 1: Basic API Connection');
  console.log('   Testing if API is reachable...\n');

  try {
    const response = await fetch(`${ZO_API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('   Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.text();
      console.log('   Response:', data);
      console.log('   ✅ API is reachable\n');
      return true;
    } else {
      console.log('   ⚠️  Health endpoint not available (this might be normal)\n');
      return false;
    }
  } catch (error) {
    console.log('   ⚠️  Could not reach health endpoint:', error instanceof Error ? error.message : error);
    console.log('   (This might be normal if no health endpoint exists)\n');
    return false;
  }
}

// Test 2: Test with client key (no user auth)
async function testWithClientKey() {
  console.log('📡 Test 2: API Call with Client Key');
  console.log('   Testing public endpoint with HTTP_CLIENT_KEY header...\n');

  try {
    // Try a common endpoint that might not require user auth
    const response = await fetch(`${ZO_API_BASE_URL}/api/v1/config`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'HTTP_CLIENT_KEY': ZO_CLIENT_KEY_WEB!,
      },
    });

    console.log('   Status:', response.status, response.statusText);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('   Response:', text.substring(0, 500));
    
    if (response.ok) {
      console.log('   ✅ Client key accepted!\n');
      return true;
    } else if (response.status === 401) {
      console.log('   ℹ️  401 Unauthorized - This endpoint requires user authentication\n');
      return false;
    } else if (response.status === 404) {
      console.log('   ℹ️  404 Not Found - This endpoint might not exist\n');
      return false;
    } else {
      console.log('   ⚠️  Unexpected response\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    return false;
  }
}

// Test 3: Test profile endpoint (requires auth)
async function testProfileEndpoint() {
  console.log('📡 Test 3: Profile Endpoint (without user token)');
  console.log('   Testing /api/v1/profile/me/ endpoint...\n');

  try {
    const response = await fetch(`${ZO_API_BASE_URL}/api/v1/profile/me/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'HTTP_CLIENT_KEY': ZO_CLIENT_KEY_WEB!,
      },
    });

    console.log('   Status:', response.status, response.statusText);
    
    const text = await response.text();
    console.log('   Response:', text.substring(0, 500));
    
    if (response.status === 401) {
      console.log('   ✅ Expected 401 - Endpoint exists but requires authentication\n');
      return true;
    } else if (response.ok) {
      console.log('   ⚠️  Unexpected success without auth token\n');
      return true;
    } else {
      console.log('   ℹ️  Status:', response.status, '\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    return false;
  }
}

// Test 4: Try alternative header names
async function testAlternativeHeaders() {
  console.log('📡 Test 4: Testing Alternative Header Names');
  console.log('   Comparing HTTP_CLIENT_KEY vs client-key...\n');

  const headerVariants = [
    { name: 'HTTP_CLIENT_KEY', value: ZO_CLIENT_KEY_WEB! },
    { name: 'client-key', value: ZO_CLIENT_KEY_WEB! },
    { name: 'X-Client-Key', value: ZO_CLIENT_KEY_WEB! },
    { name: 'Authorization', value: `Bearer ${ZO_CLIENT_KEY_WEB!}` },
  ];

  for (const header of headerVariants) {
    console.log(`   Testing with "${header.name}" header...`);
    
    try {
      const response = await fetch(`${ZO_API_BASE_URL}/api/v1/profile/me/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          [header.name]: header.value,
        },
      });

      console.log(`     Status: ${response.status} ${response.statusText}`);
      
      if (response.status !== 404) {
        const text = await response.text();
        console.log(`     Response preview: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`     Error: ${error instanceof Error ? error.message : error}`);
    }
    console.log('');
  }
}

// Run all tests
async function runTests() {
  console.log('═'.repeat(60));
  console.log('  ZO API Test Suite');
  console.log('═'.repeat(60));
  console.log('');

  await testBasicConnection();
  await testWithClientKey();
  await testProfileEndpoint();
  await testAlternativeHeaders();

  console.log('═'.repeat(60));
  console.log('✅ Tests Complete!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Check which header name worked (if any)');
  console.log('   2. Request Postman collection to see all endpoints');
  console.log('   3. Implement user authentication flow');
  console.log('   4. Test with actual user token');
  console.log('');
}

// Execute
runTests().catch(console.error);

