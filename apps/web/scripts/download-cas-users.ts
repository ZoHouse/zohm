/**
 * Download ALL CAS Users Script
 * 
 * Downloads ALL users from ZO CAS API and saves to a single JSON file.
 * Saves progress every 10K users so no data is lost if interrupted.
 * 
 * Usage (run in background):
 *   nohup npx tsx scripts/download-cas-users.ts > download.log 2>&1 &
 * 
 * Or with environment variables:
 *   CAS_ADMIN_TOKEN="..." CAS_DEVICE_ID="..." CAS_DEVICE_SECRET="..." npx tsx scripts/download-cas-users.ts
 * 
 * Options:
 *   --all           Download ALL users (default)
 *   --start=N       Resume from offset N
 *   --limit=N       Stop after N users (for testing)
 */

import * as fs from 'fs';
import * as path from 'path';

// Parse CLI args
const args = process.argv.slice(2);
const startArg = args.find(a => a.startsWith('--start='));
const limitArg = args.find(a => a.startsWith('--limit='));
const START_OFFSET = startArg ? parseInt(startArg.split('=')[1]) : 0;
const USER_LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity; // Download ALL by default

// Configuration
const CONFIG = {
  CAS_API_BASE: 'https://api.io.zo.xyz',
  CAS_ACCESS_TOKEN: process.env.CAS_ADMIN_TOKEN || '',
  CAS_CLIENT_KEY: process.env.CAS_CLIENT_KEY || '273cebeeff2130e3501f',
  CAS_DEVICE_ID: process.env.CAS_DEVICE_ID || '',
  CAS_DEVICE_SECRET: process.env.CAS_DEVICE_SECRET || '',
  BATCH_SIZE: 100,           // Users per API call
  SAVE_EVERY: 50000,         // Save to NEW FILE every 50K users
  RATE_LIMIT_DELAY_MS: 100,  // Slower - 10 requests/sec to avoid 504s
  OUTPUT_DIR: path.join(__dirname, '../data'),
};

// Common headers for CAS API requests
function getCASHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${CONFIG.CAS_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'client-key': CONFIG.CAS_CLIENT_KEY,
    'client-device-id': CONFIG.CAS_DEVICE_ID,
    'client-device-secret': CONFIG.CAS_DEVICE_SECRET,
  };
}

interface CASUser {
  id: string;
  profile: {
    pid: string;
    nickname?: string | null;
    full_name?: string;
    bio?: string;
    pfp_image?: string;
    avatar?: { ref_id?: string; image?: string; metadata?: string };
    date_of_birth?: string | null;
    gender?: string | null;
    relationship_status?: string | null;
    country?: { id: string; name: string; code: string } | null;
    cultures?: Array<{ key: string; name: string }>;
    socials?: Array<{ platform: string; handle: string; url?: string }>;
  } | null;
  membership?: string;
  verified?: boolean;
  created_at: string;
  updated_at: string;
  erase_scheduled_for?: string | null;
  merged_into?: string | null;
  founder_token_ids?: number[];
  mobiles?: Array<{
    id: number;
    mobile_country_code: string;
    mobile_number: string;
    primary: boolean;
    verified: boolean;
    has_whatsapp: boolean;
    dnd: boolean;
  }>;
  emails?: Array<{
    id: number;
    email_address: string;
    verification_type: string;
    primary: boolean;
    verified: boolean;
    dnd: boolean;
    promotional: boolean;
  }>;
  web3_wallets?: Array<{
    id: number;
    wallet_address: string;
    address_type: string;
    primary: boolean;
    verified: boolean;
    is_delegate: boolean;
    is_custodial: boolean;
  }>;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Transform raw CAS user to enrichment format
function transformUser(user: CASUser) {
  const primaryMobile = user.mobiles?.find(m => m.primary) || user.mobiles?.[0];
  const primaryEmail = user.emails?.find(e => e.verified) || user.emails?.find(e => e.primary) || user.emails?.[0];
  const primaryWallet = user.web3_wallets?.find(w => w.primary) || user.web3_wallets?.[0];
  
  return {
    id: user.id,
    zo_pid: user.profile?.pid || null,
    nickname: user.profile?.nickname || null,
    full_name: user.profile?.full_name || null,
    bio: user.profile?.bio || null,
    pfp: user.profile?.pfp_image || user.profile?.avatar?.image || null,
    avatar_ref: user.profile?.avatar?.ref_id || null,
    birthdate: user.profile?.date_of_birth || null,
    gender: user.profile?.gender || null,
    relationship_status: user.profile?.relationship_status || null,
    country: user.profile?.country?.name || null,
    country_code: user.profile?.country?.code || null,
    cultures: user.profile?.cultures || null,
    socials: user.profile?.socials || null,
    phone_country_code: primaryMobile?.mobile_country_code || null,
    phone_number: primaryMobile?.mobile_number || null,
    phone_full: primaryMobile ? `+${primaryMobile.mobile_country_code}${primaryMobile.mobile_number}` : null,
    phone_verified: primaryMobile?.verified || false,
    has_whatsapp: primaryMobile?.has_whatsapp || false,
    all_phones: user.mobiles?.map(m => ({
      country_code: m.mobile_country_code,
      number: m.mobile_number,
      full: `+${m.mobile_country_code}${m.mobile_number}`,
      primary: m.primary,
      verified: m.verified,
      whatsapp: m.has_whatsapp,
    })) || [],
    email: primaryEmail?.email_address || null,
    email_verified: primaryEmail?.verified || false,
    all_emails: user.emails?.map(e => ({
      address: e.email_address,
      verified: e.verified,
      primary: e.primary,
      type: e.verification_type,
    })) || [],
    wallet_address: primaryWallet?.wallet_address || null,
    wallet_verified: primaryWallet?.verified || false,
    wallet_custodial: primaryWallet?.is_custodial || false,
    all_wallets: user.web3_wallets?.map(w => ({
      address: w.wallet_address,
      type: w.address_type,
      primary: w.primary,
      verified: w.verified,
      custodial: w.is_custodial,
    })) || [],
    membership: user.membership || null,
    verified: user.verified || false,
    founder_token_ids: user.founder_token_ids || [],
    created_at: user.created_at,
    updated_at: user.updated_at,
    merged_into: user.merged_into || null,
    erase_scheduled: user.erase_scheduled_for || null,
  };
}

async function downloadAllUsers() {
  const startTime = Date.now();
  
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('   📥 DOWNLOAD ALL CAS USERS');
  console.log('════════════════════════════════════════════════════════════\n');

  if (!CONFIG.CAS_ACCESS_TOKEN || !CONFIG.CAS_DEVICE_ID || !CONFIG.CAS_DEVICE_SECRET) {
    console.error('❌ Missing credentials. Set CAS_ADMIN_TOKEN, CAS_DEVICE_ID, CAS_DEVICE_SECRET');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  const allUsers: ReturnType<typeof transformUser>[] = [];
  let offset = START_OFFSET;
  let totalCount = 0;
  let downloaded = 0;
  let lastSaveAt = 0;
  let errorCount = 0;
  const MAX_ERRORS = 5;

  // Files are saved with offset ranges to prevent overwrites
  const getOutputFile = (startOffset: number, endOffset: number) => 
    path.join(CONFIG.OUTPUT_DIR, `cas-users-${startOffset}-${endOffset}.json`);
  
  let currentBatchStart = START_OFFSET;

  console.log(`📡 Fetching users from CAS API...`);
  console.log(`   Starting at offset: ${START_OFFSET.toLocaleString()}`);
  console.log(`   Limit: ${USER_LIMIT === Infinity ? 'ALL USERS' : USER_LIMIT.toLocaleString()}`);
  console.log(`   Saving to separate files every: ${CONFIG.SAVE_EVERY.toLocaleString()} users`);
  console.log(`   Output dir: ${CONFIG.OUTPUT_DIR}\n`);

  while (downloaded < USER_LIMIT) {
    try {
      const url = `${CONFIG.CAS_API_BASE}/api/v1/cas/users/?limit=${CONFIG.BATCH_SIZE}&offset=${offset}`;
      
      const response = await fetch(url, { headers: getCASHeaders() });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${response.status} - ${text}`);
      }

      const data = await response.json();
      
      if (offset === START_OFFSET) {
        totalCount = data.count;
        console.log(`📊 Total users in CAS: ${totalCount.toLocaleString()}\n`);
      }

      if (!data.results || data.results.length === 0) {
        console.log('   ✅ Reached end of users');
        break;
      }

      // Transform and add users
      for (const user of data.results) {
        allUsers.push(transformUser(user));
        downloaded++;
        if (downloaded >= USER_LIMIT) break;
      }
      
      // Progress logging
      if (downloaded % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = downloaded / elapsed;
        const remaining = (totalCount - START_OFFSET - downloaded) / rate;
        console.log(`   📥 ${(START_OFFSET + downloaded).toLocaleString()} / ${totalCount.toLocaleString()} users (${rate.toFixed(0)}/sec, ~${Math.ceil(remaining/60)}min remaining)`);
      }

      // Save to SEPARATE file every SAVE_EVERY users (won't overwrite!)
      if (downloaded - lastSaveAt >= CONFIG.SAVE_EVERY) {
        const batchEndOffset = START_OFFSET + downloaded;
        const batchFile = getOutputFile(currentBatchStart, batchEndOffset);
        console.log(`   💾 Saving batch to ${path.basename(batchFile)}...`);
        fs.writeFileSync(batchFile, JSON.stringify(allUsers.slice(lastSaveAt), null, 2));
        currentBatchStart = batchEndOffset;
        lastSaveAt = downloaded;
      }

      if (!data.next) {
        console.log('   ✅ No more pages');
        break;
      }
      
      offset += CONFIG.BATCH_SIZE;
      errorCount = 0; // Reset error count on success
      await sleep(CONFIG.RATE_LIMIT_DELAY_MS);

    } catch (error: any) {
      errorCount++;
      const is504 = error?.message?.includes('504');
      const waitTime = is504 ? 30000 * errorCount : 5000 * errorCount; // 30s for 504, 5s for others
      
      console.error(`\n❌ Error at offset ${offset} (attempt ${errorCount}/${MAX_ERRORS}):`, error?.message || error);
      console.log(`   ⏳ Waiting ${waitTime/1000}s before retry...`);
      
      if (errorCount >= MAX_ERRORS) {
        // Save what we have before exiting
        if (allUsers.length > lastSaveAt) {
          const batchFile = getOutputFile(currentBatchStart, START_OFFSET + downloaded);
          console.log(`\n💾 Saving ${downloaded - lastSaveAt} users before exit to ${path.basename(batchFile)}...`);
          fs.writeFileSync(batchFile, JSON.stringify(allUsers.slice(lastSaveAt), null, 2));
        }
        console.error(`\n🛑 Too many errors. Run again with --start=${START_OFFSET + downloaded} to resume.`);
        break;
      }
      
      await sleep(waitTime);
    }
  }

  // Save remaining users to final batch file
  if (allUsers.length > lastSaveAt) {
    const finalBatchFile = getOutputFile(currentBatchStart, START_OFFSET + downloaded);
    console.log(`\n💾 Saving final batch to ${path.basename(finalBatchFile)}...`);
    fs.writeFileSync(finalBatchFile, JSON.stringify(allUsers.slice(lastSaveAt), null, 2));
  }

  const elapsed = (Date.now() - startTime) / 1000;
  
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('   ✅ BATCH DOWNLOAD COMPLETE!');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`📁 Downloaded ${allUsers.length.toLocaleString()} users (offset ${START_OFFSET} to ${START_OFFSET + downloaded})`);
  console.log(`   Saved to: ${CONFIG.OUTPUT_DIR}/cas-users-*.json\n`);
  console.log(`⏱️  Time: ${Math.floor(elapsed/60)}min ${Math.floor(elapsed%60)}sec`);
  console.log(`📈 Rate: ${(allUsers.length / elapsed).toFixed(1)} users/sec\n`);
  
  const nextOffset = START_OFFSET + downloaded;
  if (nextOffset < totalCount) {
    console.log(`📌 To continue downloading remaining ${(totalCount - nextOffset).toLocaleString()} users:`);
    console.log(`   npx tsx scripts/download-cas-users.ts --start=${nextOffset}\n`);
  }

  // Stats
  const total = allUsers.length;
  if (total === 0) {
    console.log('❌ No users downloaded!');
    return;
  }
  
  const pct = (n: number) => `${n.toLocaleString()} (${((n/total)*100).toFixed(1)}%)`;
  
  const stats = {
    nickname: allUsers.filter(u => u.nickname).length,
    full_name: allUsers.filter(u => u.full_name).length,
    pfp: allUsers.filter(u => u.pfp).length,
    phone: allUsers.filter(u => u.phone_number).length,
    phone_verified: allUsers.filter(u => u.phone_verified).length,
    whatsapp: allUsers.filter(u => u.has_whatsapp).length,
    email: allUsers.filter(u => u.email).length,
    email_verified: allUsers.filter(u => u.email_verified).length,
    wallet: allUsers.filter(u => u.wallet_address).length,
    bio: allUsers.filter(u => u.bio).length,
    birthdate: allUsers.filter(u => u.birthdate).length,
    founders: allUsers.filter(u => u.membership === 'founder').length,
  };

  console.log('📊 Data completeness:');
  console.log(`   With nickname:       ${pct(stats.nickname)}`);
  console.log(`   With full_name:      ${pct(stats.full_name)}`);
  console.log(`   With avatar:         ${pct(stats.pfp)}`);
  console.log(`   With phone:          ${pct(stats.phone)}`);
  console.log(`   Phone verified:      ${pct(stats.phone_verified)}`);
  console.log(`   Has WhatsApp:        ${pct(stats.whatsapp)}`);
  console.log(`   With email:          ${pct(stats.email)}`);
  console.log(`   Email verified:      ${pct(stats.email_verified)}`);
  console.log(`   With wallet:         ${pct(stats.wallet)}`);
  console.log(`   With bio:            ${pct(stats.bio)}`);
  console.log(`   With birthdate:      ${pct(stats.birthdate)}`);
  console.log(`   Founders:            ${pct(stats.founders)}`);
  console.log('\n🎉 Done! Ready for enrichment.\n');
}

downloadAllUsers().catch(console.error);
