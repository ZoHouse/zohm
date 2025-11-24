#!/usr/bin/env node

/**
 * Delete Node Script
 * 
 * Deletes a node from the Zo World database.
 * 
 * Usage:
 *   node scripts/delete-node.mjs --id "deepak-zo-house"
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../apps/web/.env.local');
try {
  const envConfig = readFileSync(envPath, 'utf-8');
  const env = {};
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  Object.assign(process.env, env);
} catch (error) {
  // Silently fail, will check credentials below
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const value = args[i + 1];
      parsed[key] = value;
      i++;
    }
  }
  
  return parsed;
}

async function deleteNode(id) {
  // First, get the node to show what we're deleting
  const { data: node } = await supabase
    .from('nodes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (!node) {
    console.error(`❌ Node "${id}" not found`);
    process.exit(1);
  }
  
  console.log('🗑️  Deleting node:');
  console.log(`   Name: ${node.name}`);
  console.log(`   Location: ${node.city}, ${node.country}`);
  console.log('');
  
  const { error } = await supabase
    .from('nodes')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  console.log('✅ Node deleted successfully');
}

async function main() {
  const args = parseArgs();
  
  if (!args.id) {
    console.error('❌ Missing required argument: --id');
    console.error('\nUsage:');
    console.error('  node scripts/delete-node.mjs --id "node-slug"');
    process.exit(1);
  }
  
  try {
    await deleteNode(args.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

