/**
 * ZO Admin Login Script
 *
 * Interactive login to ZO API to get admin access token.
 * Uses OTP authentication via mobile number.
 *
 * Usage:
 *   npx ts-node scripts/zo-login.ts
 *
 * This will:
 * 1. Generate device credentials
 * 2. Request OTP to your phone
 * 3. Wait for you to enter the OTP
 * 4. Return the access token
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

// Configuration - ZO CAS Admin API (do NOT use ZO_API_BASE_URL as that's the game app API)
const ZO_API_BASE = process.env.ZO_CAS_API_URL || 'https://api.io.zo.xyz'; // Production ZO API
const CLIENT_KEY = process.env.ZO_CAS_CLIENT_KEY || '273cebeeff2130e3501f'; // Admin app ID

// Generate device credentials
function generateDeviceCredentials() {
  const deviceId = crypto.randomUUID();
  const deviceSecret = Buffer.from(Date.now() + deviceId).toString('base64');
  return { deviceId, deviceSecret };
}

// Create readline interface for user input
function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Prompt user for input
function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

// API request helper
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST',
  body: any,
  headers: Record<string, string>
): Promise<any> {
  const url = `${ZO_API_BASE}${endpoint}`;
  console.log(`\n📡 ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Error: ${response.status} ${response.statusText}`);
    console.error('Response:', JSON.stringify(data, null, 2));
    throw new Error(`API Error: ${response.status}`);
  }

  return data;
}

async function main() {
  console.log('\n========================================');
  console.log('   ZO Admin Login');
  console.log('========================================\n');
  console.log(`API Base: ${ZO_API_BASE}`);

  const rl = createPrompt();

  try {
    // Check if user wants to paste existing token
    console.log('\n--- Login Method ---\n');
    console.log('1. Request OTP (may require captcha)');
    console.log('2. Paste existing token from browser');
    const method = await ask(rl, '\nChoose method (1 or 2): ') || '1';
    
    if (method === '2') {
      console.log('\n--- Paste Existing Token ---\n');
      console.log('To get your token from the browser:');
      console.log('1. Go to zo.xyz and login');
      console.log('2. Open DevTools (F12) → Application → Local Storage');
      console.log('3. Find the "token" or "access_token" key');
      console.log('4. Copy the value and paste below\n');
      
      const token = await ask(rl, 'Paste your token: ');
      
      if (!token) {
        console.error('❌ Token is required');
        process.exit(1);
      }
      
      // Save token
      const tokenFile = path.join(__dirname, '../.zo-admin-token');
      fs.writeFileSync(tokenFile, token.trim());
      console.log(`\n✅ Token saved to: ${tokenFile}`);
      
      console.log('\n--- Next Steps ---\n');
      console.log('Test the token with:');
      console.log(`  CAS_ADMIN_TOKEN="$(cat ${tokenFile})" npx tsx scripts/cas-api-test.ts\n`);
      
      rl.close();
      return;
    }

    // Step 1: Get phone number
    console.log('\n--- Step 1: Enter Phone Number ---\n');
    const countryCode = await ask(rl, 'Country code (default: 91): ') || '91';
    const phoneNumber = await ask(rl, 'Phone number (without country code): ');

    if (!phoneNumber) {
      console.error('❌ Phone number is required');
      process.exit(1);
    }

    // Step 2: Generate device credentials
    console.log('\n--- Step 2: Generating Device Credentials ---\n');
    const { deviceId, deviceSecret } = generateDeviceCredentials();
    console.log(`Device ID: ${deviceId}`);
    console.log(`Device Secret: ${deviceSecret.substring(0, 20)}...`);

    const headers = {
      'client-device-id': deviceId,
      'client-device-secret': deviceSecret,
      'client-key': CLIENT_KEY,
    };

    // Step 3: Request OTP
    console.log('\n--- Step 3: Requesting OTP ---\n');
    console.log(`Sending OTP to +${countryCode} ${phoneNumber}...`);

    // The correct endpoint is /api/v1/auth/login/mobile/otp/
    // This triggers OTP to be sent
    try {
      const otpResponse = await apiRequest(
        '/api/v1/auth/login/mobile/otp/',
        'POST',
        {
          mobile_country_code: countryCode,
          mobile_number: phoneNumber,
          message_channel: '', // SMS (use 'whatsapp' for WhatsApp)
        },
        headers
      );

      console.log('✅ OTP sent successfully!');
      if (otpResponse.success) {
        console.log('Check your phone for the OTP.');
      }
    } catch (error) {
      console.error('Failed with login/mobile/otp. Trying request-otp endpoint...');

      try {
        // Alternate endpoint
        await apiRequest(
          '/api/v1/auth/request-otp/mobile/',
          'POST',
          {
            mobile_country_code: countryCode,
            mobile_number: phoneNumber,
          },
          headers
        );
        console.log('✅ OTP sent via request-otp endpoint!');
      } catch (error2) {
        // If both fail, the API might require captcha for web clients
        console.error('\n⚠️  OTP request failed. The API may require captcha verification.');
        console.error('Try logging in through the Zo app on your phone first, then use that session.');
        throw error2;
      }
    }

    // Step 4: Get OTP from user
    console.log('\n--- Step 4: Enter OTP ---\n');
    const otp = await ask(rl, 'Enter the OTP you received: ');

    if (!otp) {
      console.error('❌ OTP is required');
      process.exit(1);
    }

    // Step 5: Verify OTP and get token
    console.log('\n--- Step 5: Verifying OTP ---\n');

    // The correct endpoint is /api/v1/auth/login/mobile/
    const loginResponse = await apiRequest(
      '/api/v1/auth/login/mobile/',
      'POST',
      {
        mobile_country_code: countryCode,
        mobile_number: phoneNumber,
        otp: otp,
      },
      headers
    );

    console.log('✅ Login successful!');

    // Extract token
    const token = loginResponse.token || loginResponse.access_token || loginResponse.access;
    const user = loginResponse.user;

    if (!token) {
      console.log('\nFull response:', JSON.stringify(loginResponse, null, 2));
      console.error('❌ Could not find token in response');
      process.exit(1);
    }

    // Display results
    console.log('\n========================================');
    console.log('   Login Successful!');
    console.log('========================================\n');

    if (user) {
      console.log('👤 User Info:');
      console.log(`   ID: ${user.id || user.pid || 'N/A'}`);
      console.log(`   Name: ${user.profile?.full_name || user.name || 'N/A'}`);
      console.log(`   Membership: ${user.membership || 'N/A'}`);
      console.log(`   Verified: ${user.verified || 'N/A'}`);
    }

    console.log('\n🔑 Access Token:');
    console.log('─'.repeat(50));
    console.log(token);
    console.log('─'.repeat(50));

    // Check if user has admin roles
    const roles = user?.roles || user?.zo_roles || [];
    if (roles.includes('cas') || roles.includes('admin') || roles.includes('cas-admin')) {
      console.log('\n✅ User has CAS admin role!');
    } else {
      console.log('\n⚠️  User roles:', roles.length > 0 ? roles.join(', ') : 'None detected');
      console.log('   Note: CAS admin access may still work based on backend permissions.');
    }

    // Save token to file
    const tokenFile = path.join(__dirname, '../.zo-admin-token');
    fs.writeFileSync(tokenFile, token);
    console.log(`\n📁 Token saved to: ${tokenFile}`);

    // Instructions
    console.log('\n--- Next Steps ---\n');
    console.log('To use this token for user enrichment:\n');
    console.log('  Option 1: Export as environment variable');
    console.log(`    export CAS_ADMIN_TOKEN="${token.substring(0, 50)}..."\n`);
    console.log('  Option 2: Run enrichment directly');
    console.log(`    CAS_ADMIN_TOKEN="$(cat ${tokenFile})" npx ts-node scripts/enrich-users.ts --dry-run\n`);
    console.log('  Option 3: Test API access first');
    console.log(`    CAS_ADMIN_TOKEN="$(cat ${tokenFile})" npx ts-node scripts/cas-api-test.ts\n`);

    // Also save device credentials for future use
    const credsFile = path.join(__dirname, '../.zo-device-creds.json');
    fs.writeFileSync(credsFile, JSON.stringify({
      deviceId,
      deviceSecret,
      clientKey: CLIENT_KEY,
      tokenCreatedAt: new Date().toISOString(),
    }, null, 2));
    console.log(`📁 Device credentials saved to: ${credsFile}`);

  } catch (error) {
    console.error('\n❌ Login failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
