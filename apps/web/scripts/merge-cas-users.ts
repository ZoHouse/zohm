/**
 * Merge CAS User Batch Files
 * 
 * Combines all cas-users-*.json batch files into a single file.
 * 
 * Usage:
 *   npx tsx scripts/merge-cas-users.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../data');

async function mergeFiles() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('   🔗 MERGE CAS USER FILES');
  console.log('════════════════════════════════════════════════════════════\n');

  // Find all batch files
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('cas-users-') && f.endsWith('.json') && !f.includes('complete') && !f.includes('merged'))
    .sort((a, b) => {
      // Sort by start offset
      const aStart = parseInt(a.split('-')[2]) || 0;
      const bStart = parseInt(b.split('-')[2]) || 0;
      return aStart - bStart;
    });

  if (files.length === 0) {
    console.log('❌ No batch files found in', DATA_DIR);
    return;
  }

  console.log(`📁 Found ${files.length} batch files:\n`);
  
  const allUsers: any[] = [];
  
  for (const file of files) {
    const filepath = path.join(DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    console.log(`   ${file}: ${data.length.toLocaleString()} users`);
    allUsers.push(...data);
  }

  // Remove duplicates by ID
  const uniqueUsers = new Map();
  for (const user of allUsers) {
    uniqueUsers.set(user.id, user);
  }
  
  const deduped = Array.from(uniqueUsers.values());
  
  console.log(`\n📊 Total: ${allUsers.length.toLocaleString()} users`);
  console.log(`   Unique: ${deduped.length.toLocaleString()} users`);
  console.log(`   Duplicates removed: ${allUsers.length - deduped.length}`);

  // Save merged file
  const outputFile = path.join(DATA_DIR, `cas-users-merged-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(deduped, null, 2));
  
  console.log(`\n✅ Saved merged file to:`);
  console.log(`   ${outputFile}\n`);

  // Stats
  const total = deduped.length;
  const pct = (n: number) => `${n.toLocaleString()} (${((n/total)*100).toFixed(1)}%)`;
  
  const stats = {
    nickname: deduped.filter((u: any) => u.nickname).length,
    full_name: deduped.filter((u: any) => u.full_name).length,
    pfp: deduped.filter((u: any) => u.pfp).length,
    phone: deduped.filter((u: any) => u.phone_number).length,
    email: deduped.filter((u: any) => u.email).length,
    wallet: deduped.filter((u: any) => u.wallet_address).length,
  };

  console.log('📊 Data completeness:');
  console.log(`   With nickname:   ${pct(stats.nickname)}`);
  console.log(`   With full_name:  ${pct(stats.full_name)}`);
  console.log(`   With avatar:     ${pct(stats.pfp)}`);
  console.log(`   With phone:      ${pct(stats.phone)}`);
  console.log(`   With email:      ${pct(stats.email)}`);
  console.log(`   With wallet:     ${pct(stats.wallet)}`);
  console.log('\n');
}

mergeFiles().catch(console.error);
