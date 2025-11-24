#!/usr/bin/env node

/**
 * Add Node Script
 * 
 * Programmatically adds a node to the Zo World map database.
 * 
 * Usage:
 *   node scripts/add-node.mjs --url "https://maps.app.goo.gl/..." --name "Deepak's Zo House"
 *   node scripts/add-node.mjs --lat 12.9234 --lng 77.6345 --name "My Zo House" --city "Bangalore"
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { URL } from 'url';
import { config } from 'dotenv';
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
  console.log('✅ Loaded environment variables from .env.local\n');
} catch (error) {
  console.warn('⚠️  Could not load .env.local, using system environment variables');
}

// Supabase credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command-line arguments
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

// Extract coordinates from Google Maps shortened URL
async function extractCoordinatesFromGoogleMaps(shortUrl) {
  return new Promise((resolve, reject) => {
    console.log('🔍 Resolving Google Maps link...');
    
    https.get(shortUrl, { followRedirect: false }, (res) => {
      const location = res.headers.location;
      
      if (!location) {
        reject(new Error('Could not resolve Google Maps link'));
        return;
      }
      
      console.log('✅ Resolved to:', location);
      
      // Try to extract coordinates from URL patterns
      // Pattern 1: /@lat,lng,zoom
      const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+),/;
      const match1 = location.match(pattern1);
      
      if (match1) {
        resolve({
          lat: parseFloat(match1[1]),
          lng: parseFloat(match1[2])
        });
        return;
      }
      
      // Pattern 2: /place/Name/@lat,lng
      const pattern2 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match2 = location.match(pattern2);
      
      if (match2) {
        resolve({
          lat: parseFloat(match2[1]),
          lng: parseFloat(match2[2])
        });
        return;
      }
      
      reject(new Error('Could not extract coordinates from URL'));
    }).on('error', reject);
  });
}

// Reverse geocode coordinates to get address
async function reverseGeocode(lat, lng) {
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!MAPBOX_TOKEN) {
    console.warn('⚠️ No MAPBOX_TOKEN found, skipping address lookup');
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const place = json.features[0];
          
          if (place) {
            const context = place.context || [];
            const city = context.find(c => c.id.startsWith('place'))?.text;
            const country = context.find(c => c.id.startsWith('country'))?.text;
            
            resolve({
              address: place.place_name,
              city: city || place.text,
              country: country || 'Unknown'
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Add node to database
async function addNode(nodeData) {
  const slug = generateSlug(nodeData.name);
  
  console.log('\n📝 Adding node to database...');
  console.log('   Name:', nodeData.name);
  console.log('   Slug:', slug);
  console.log('   Location:', `${nodeData.lat}, ${nodeData.lng}`);
  console.log('   City:', nodeData.city);
  console.log('   Country:', nodeData.country);
  
  const { data, error } = await supabase
    .from('nodes')
    .upsert({
      id: slug,
      name: nodeData.name,
      type: nodeData.type || 'culture_house',
      description: nodeData.description || `${nodeData.name} - Community hub`,
      city: nodeData.city,
      country: nodeData.country,
      latitude: nodeData.lat,
      longitude: nodeData.lng,
      website: nodeData.website || null,
      twitter: nodeData.twitter || null,
      features: nodeData.features || ['coworking', 'events'],
      status: nodeData.status || 'active',
      image: nodeData.image || null,
      contact_email: nodeData.email || null,
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    .select();
  
  if (error) {
    throw error;
  }
  
  console.log('\n✅ Node added successfully!');
  console.log('   ID:', slug);
  console.log('   View on map at:', `http://localhost:3001`);
  
  return data;
}

// Main function
async function main() {
  console.log('🏠 Zo World Node Manager\n');
  
  const args = parseArgs();
  
  // Validate required arguments
  if (!args.name) {
    console.error('❌ Missing required argument: --name');
    console.error('\nUsage:');
    console.error('  node scripts/add-node.mjs --url "https://maps.app.goo.gl/..." --name "My Zo House"');
    console.error('  node scripts/add-node.mjs --lat 12.9234 --lng 77.6345 --name "My Zo House" --city "Bangalore" --country "India"');
    process.exit(1);
  }
  
  let lat, lng, city, country, address;
  
  // Method 1: From Google Maps URL
  if (args.url) {
    try {
      const coords = await extractCoordinatesFromGoogleMaps(args.url);
      lat = coords.lat;
      lng = coords.lng;
      
      console.log('📍 Coordinates:', lat, lng);
      
      // Try to get address details
      const location = await reverseGeocode(lat, lng);
      if (location) {
        address = location.address;
        city = args.city || location.city;
        country = args.country || location.country;
        console.log('🌍 Location:', city, country);
      }
    } catch (error) {
      console.error('❌ Failed to extract coordinates from URL:', error.message);
      process.exit(1);
    }
  }
  // Method 2: Direct coordinates
  else if (args.lat && args.lng) {
    lat = parseFloat(args.lat);
    lng = parseFloat(args.lng);
    
    console.log('📍 Using provided coordinates:', lat, lng);
    
    // Try to get address details
    try {
      const location = await reverseGeocode(lat, lng);
      if (location) {
        address = location.address;
        city = args.city || location.city;
        country = args.country || location.country;
        console.log('🌍 Location:', city, country);
      }
    } catch (error) {
      console.warn('⚠️ Could not reverse geocode, using provided city/country');
      city = args.city;
      country = args.country;
    }
  }
  else {
    console.error('❌ Must provide either --url or (--lat and --lng)');
    process.exit(1);
  }
  
  // Validate we have all required data
  if (!city || !country) {
    console.error('❌ Missing city or country. Please provide --city and --country manually.');
    process.exit(1);
  }
  
  // Prepare node data
  const nodeData = {
    name: args.name,
    lat,
    lng,
    city,
    country,
    address,
    type: args.type,
    description: args.description,
    website: args.website,
    twitter: args.twitter,
    email: args.email,
    status: args.status,
    image: args.image,
    features: args.features ? args.features.split(',') : undefined
  };
  
  // Add to database
  try {
    await addNode(nodeData);
  } catch (error) {
    console.error('❌ Failed to add node:', error.message);
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

