/**
 * Download CAS Admin Founders Only
 *
 * Fetches founder members from ZO CAS API and saves to data/cas-founders.json.
 * Tries API filter ?membership=founder first; if not supported, paginates and filters.
 *
 * Usage:
 *   CAS_ADMIN_TOKEN="..." CAS_DEVICE_ID="..." CAS_DEVICE_SECRET="..." \
 *   npx tsx scripts/download-cas-founders.ts
 *
 * Or use run-download.sh env and run:
 *   npx tsx scripts/download-cas-founders.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const CONFIG = {
  CAS_API_BASE: 'https://api.io.zo.xyz',
  CAS_ACCESS_TOKEN: process.env.CAS_ADMIN_TOKEN || '',
  CAS_DEVICE_ID: process.env.CAS_DEVICE_ID || '',
  CAS_DEVICE_SECRET: process.env.CAS_DEVICE_SECRET || '',
  CAS_CLIENT_KEY: process.env.CAS_CLIENT_KEY || '273cebeeff2130e3501f',
  BATCH_SIZE: 100,
  OUTPUT_DIR: path.join(__dirname, '../data'),
  OUTPUT_FILE: 'cas-founders.json',
  MAX_PAGES_IF_NO_FILTER: 100, // Stop after this many pages when filtering client-side
};

function getCASHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${CONFIG.CAS_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'client-key': CONFIG.CAS_CLIENT_KEY,
    'client-device-id': CONFIG.CAS_DEVICE_ID,
    'client-device-secret': CONFIG.CAS_DEVICE_SECRET,
  };
}

// Minimal transform: same shape as download-cas-users for compatibility
function transformUser(user: any) {
  const primaryMobile = user.mobiles?.find((m: any) => m.primary) || user.mobiles?.[0];
  const primaryEmail = user.emails?.find((e: any) => e.verified) || user.emails?.[0];
  const primaryWallet = user.web3_wallets?.find((w: any) => w.primary) || user.web3_wallets?.[0];
  return {
    id: user.id,
    zo_pid: user.profile?.pid || null,
    nickname: user.profile?.nickname || null,
    full_name: user.profile?.full_name || null,
    bio: user.profile?.bio || null,
    pfp: user.profile?.pfp_image || user.profile?.avatar?.image || null,
    birthdate: user.profile?.date_of_birth || null,
    country: user.profile?.country?.name || null,
    phone_country_code: primaryMobile?.mobile_country_code || null,
    phone_number: primaryMobile?.mobile_number || null,
    phone_full: primaryMobile ? `+${primaryMobile.mobile_country_code}${primaryMobile.mobile_number}` : null,
    email: primaryEmail?.email_address || null,
    wallet_address: primaryWallet?.wallet_address || null,
    membership: user.membership || null,
    founder_token_ids: user.founder_token_ids || [],
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function main() {
  if (!CONFIG.CAS_ACCESS_TOKEN || !CONFIG.CAS_DEVICE_ID || !CONFIG.CAS_DEVICE_SECRET) {
    console.error('❌ Set CAS_ADMIN_TOKEN, CAS_DEVICE_ID, CAS_DEVICE_SECRET');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  const outPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.OUTPUT_FILE);
  const headers = getCASHeaders();

  // 1) Try filtered endpoint (if CAS supports it)
  const filterUrl = `${CONFIG.CAS_API_BASE}/api/v1/cas/users/?limit=${CONFIG.BATCH_SIZE}&offset=0&membership=founder`;
  let founders: any[] = [];

  const filterRes = await fetch(filterUrl, { headers });
  if (filterRes.ok) {
    const data = await filterRes.json();
    const results = data.results || [];
    if (results.length > 0 && results.some((u: any) => u.membership === 'founder')) {
      founders = results.map(transformUser);
      let nextUrl = data.next;
      while (nextUrl) {
        const nextRes = await fetch(nextUrl, { headers });
        if (!nextRes.ok) break;
        const nextData = await nextRes.json();
        const nextResults = (nextData.results || []).map(transformUser);
        founders.push(...nextResults);
        nextUrl = nextData.next;
      }
      console.log(`✅ Fetched ${founders.length} founders via ?membership=founder`);
    }
  }

  // 2) If no filter support, paginate and filter client-side
  if (founders.length === 0) {
    console.log('📡 Filter not supported; paginating and filtering for membership=founder...');
    let offset = 0;
    let page = 0;
    let totalScanned = 0;
    while (page < CONFIG.MAX_PAGES_IF_NO_FILTER) {
      const url = `${CONFIG.CAS_API_BASE}/api/v1/cas/users/?limit=${CONFIG.BATCH_SIZE}&offset=${offset}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.error('API error:', res.status, await res.text());
        break;
      }
      const data = await res.json();
      const results = data.results || [];
      for (const u of results) {
        if (u.membership === 'founder') founders.push(transformUser(u));
      }
      if (!data.next || results.length === 0) break;
      offset += CONFIG.BATCH_SIZE;
      totalScanned = offset + results.length;
      page++;
      if (page % 10 === 0) console.log(`   Scanned ${totalScanned} users, ${founders.length} founders so far...`);
    }
    console.log(`✅ Found ${founders.length} founders (scanned ${totalScanned} users)`);
  }

  fs.writeFileSync(outPath, JSON.stringify(founders, null, 2));
  console.log(`\n📁 Saved to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
