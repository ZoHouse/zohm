#!/usr/bin/env node

/**
 * List Nodes Script
 * 
 * Lists all nodes in the Zo World database.
 * 
 * Usage:
 *   node scripts/list-nodes.mjs
 *   node scripts/list-nodes.mjs --city "Bangalore"
 *   node scripts/list-nodes.mjs --type "culture_house"
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

async function listNodes(filters = {}) {
  let query = supabase.from('nodes').select('*');
  
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) {
    throw error;
  }
  
  return data;
}

async function main() {
  console.log('🏠 Zo World Nodes\n');
  
  const args = parseArgs();
  
  try {
    const nodes = await listNodes(args);
    
    if (nodes.length === 0) {
      console.log('No nodes found.');
      return;
    }
    
    console.log(`Found ${nodes.length} node(s):\n`);
    
    nodes.forEach((node, i) => {
      console.log(`${i + 1}. ${node.name}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Type: ${node.type}`);
      console.log(`   Location: ${node.city}, ${node.country}`);
      console.log(`   Coordinates: ${node.latitude}, ${node.longitude}`);
      console.log(`   Status: ${node.status}`);
      if (node.website) console.log(`   Website: ${node.website}`);
      if (node.twitter) console.log(`   Twitter: @${node.twitter}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

