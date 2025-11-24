#!/usr/bin/env node

import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const rawCsv = `latitude,longitude,name
32.48,77.13,Zostel Sissu
14.53,74.32,Arthigamya Spa and Resort - Trusted by Zostel
31.35,78.44,Zostel Chitkul
30.06,78.38,Zostel Plus Rishikesh (Mohanchatti)
26.48,74.57,Zostel Pushkar
19.87,75.33,Zostel Aurangabad
15.63,73.74,Zostel Goa (Morjim)
31.32,77.5,Zostel Homes Kotgarh
11.99,79.83,Zostel Pondicherry (Auroville Road)
32.04,76.71,Zostel Bir
34.07,77.55,Zostel Homes Leh (Stok)
15.57,73.74,Craft Hostel - Trusted by Zostel
32.2,76.38,Zostel Homes Rakkar (Dharamshala)
30.13,78.32,Zostel Rishikesh
11.59,76,Zostel Homes Wayanad (Vythiri)
28.65,77.22,Zostel Delhi
18.21,73.71,Zostel Homes Bhor
32.54,76,Zostel Dalhousie
32.23,77.22,GlampEco
27.72,85.31,Zostel Kathmandu
25.31,83,Zostel Varanasi
31.69,77.34,Zostel Homes Laida
14.54,74.32,Zostel Gokarna
25.59,91.9,Zostel Shillong
26.49,74.51,Zostel Homes Pushkar
19.12,72.88,Zostel Mumbai
1,1,Test 1
31.07,77.18,Zostel Homes Shimla
17.93,73.82,Zostel Plus Panchgani
9.98,76.3,Zostel Kochi (Ernakulam)
1,1,Test 1
,,Abhimanyu Mansion
27.16,78.06,Zostel Agra
29.4,79.46,Zostel Plus Nainital (Naina Range)
30.45,78.08,Zostel Mussoorie (Mall Road)
10.27,77.4,Zostel Poombarai (Kodaikanal)
27.14,88.6,Zostel Homes Pedong
12.93,77.63,Zo House BLR
25.44,75.65,Zostel Bundi Old
31.07,77.31,Zostel Homes Cheog (Shimla)
32.61,76.02,Zostel Homes Chamera (Chamba)
13.28,75.73,Zostel Chikmagalur
32.26,77.19,Zostel Manali (Vashisht)
30.48,78.03,Zostel Plus Mussoorie (Kempty)
31.13,77.38,Zostel Homes Theog (Shimla)
31.75,77.38,Zostel Shangarh
32.54,75.92,Zostel Banikhet (Dalhousie)
26.49,74.57,Zostel Pushkar
12.41,75.78,Zostel Coorg (Madikeri)
32.11,77.18,Zostel Homes Rumsu
7.88,98.29,Zo Amalthea Hotel
15.54,73.76,Zostel Goa
,,Zostel Homes Tirthan
,,Zo House Koramangala
31.13,77.21,Zostel Homes Mashobra (Shimla)
,,Test
12.93,77.63,Zostel Bangalore (Koramangala)
,,Zostel Jaisalmer
33.93,75.27,Zostel Pahalgam
,,Zostel Spiti
,,Zostel Khajuraho
,,Zostel Jodhpur
,,Zostel Home Burwa
31.64,77.41,Zostel Homes Tirthan (Gushaini)
29.63,79.67,Zostel Homes Kasar Devi
32.26,77.19,Zostel Manali (Vashisht)
11.55,76.1,Zostel Plus Wayanad
31.99,76.82,Zostel Homes Harabhag (Joginder Nagar)
31.89,77.1,"Zostel Home Pah Nala, Kullu"
9.5,76.32,Zostel Alleppey
12.33,75.86,Zostel Coorg (Siddapura)
11.4,76.7,Zostel Ooty
32.29,77.18,Zostel Manali (Burwa)
9.96,76.24,Zostel Kochi (Fort Kochi) - OLD
31.99,77.44,Zostel Pulga
34.13,74.88,Zostel Srinagar
26.3,73.02,Zostel Jodhpur (Clock Tower)
27.23,88.28,kaluk
32.04,76.72,Zostel Plus Bir
32.28,76.3,Zostel Plus Kareri
26.93,75.83,Zostel Jaipur
31.4,78.34,Zostel Homes Rakchham
32.01,77.3,Zostel Kasol (Katagla)
28.22,83.95,Zostel Pokhara
32.26,77.18,Zostel Old Manali
32.1,77.12,Zostel Dobhi
31.31,77.48,Zostel Kotgarh (Narkanda)
15.59,73.76,XOXO Hostel - Trusted by Zostel
28.52,77.16,Zostel Delhi - South
9.96,76.24,Zostel Kochi (Fort Kochi)
32.24,76.33,Zostel McLeodganj
18.42,73.2,Zostel Kolad
30.12,78.33,Zostel Rishikesh (Laxman Jhula)
12.41,75.78,Zostel Homes Coorg
32.09,78.38,Zostel Homes Tabo
32.33,78.01,Zostel Homes Kibber
32.23,77.22,GlampEco
11.93,79.83,Micasa Hostels
32.22,78.07,Zostel Spiti
13.05,80.25,Zostel Chennai
32.17,76.31,"Zostel Home Passu, Dharamshala"
26.27,73.04,Zostel Jodhpur (Ratanada)
32.29,77.18,Zostel Manali (Burwa)
31.43,78.27,Zostel Sangla
29.46,79.15,Zostel Jim Corbett
32.61,76.89,Zostel Homes Rashil
26.91,70.91,Zostel Jaisalmer
10.05,77.05,Zostel Munnar
32.1,76.76,Zostel Barot (Rajgundha)
17.44,78.39,Zostel Hyderabad
34.17,77.58,Zostel Leh
18.57,73.91,Zostel Pune (Viman Nagar)
32.26,77.18,Zostel Old Manali (Goshal Road)
32.21,77.2,Zostel Homes Shuru
24.62,73.69,Abhimanyu Mansion
31.53,78.25,Zostel Kalpa
30.13,78.32,Zostel Rishikesh (Tapovan)
12.32,76.63,Zostel Mysore
27.23,88.28,Zostel Rinchenpong (Pelling)
32.16,77.16,Zostel Homes Pangan (Manali)
32,77.45,Zostel Homes Pulga
30.13,78.32,Zostel Rishikesh (Tapovan) (OLD)
12.96,77.64,Zostel Bangalore (Indiranagar)
,,Zostel Test
26.85,70.54,Zostel Sam Desert (Jaisalmer)
11.6,76.16,Zostel Homes Wayanad (Karapuzha)
25.44,75.65,Zostel Bundi
31.13,77.57,Zostel Homes Kotkhai (Shimla)
8.74,76.7,Zostel Varkala
31.57,77.37,Zostel Shoja (Jibhi)
18.7,73.44,Zostel Plus Lonavala
10.25,77.5,Zostel Kodaikanal
9.69,76.9,Zostel Vagamon
29.44,79.56,Zostel Homes Ramgarh (Nainital)
32.25,76.33,Zostel Dharamkot
17.72,83.32,Zostel Visakhapatnam (Vizag)
29.42,79.63,Zostel Mukteshwar
24.58,73.68,Zostel Udaipur
15.39,76.53,Zostel Hampi (Gangavathi)
11.67,92.73,Zostel Port Blair
27.34,88.61,Zostel Gangtok
15.58,73.74,Zostel Goa (Anjuna)
11.91,76,Zostel Homes Wayanad (Thirunelly)`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mapboxToken =
  process.env.MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_GL_ACCESS_TOKEN;

async function reverseGeocode(latitude, longitude) {
  if (!mapboxToken) {
    return { city: 'Unknown', country: 'Unknown', resolved: false };
  }

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`);
  url.searchParams.set('access_token', mapboxToken);
  url.searchParams.set('types', 'place,locality,district,region,country');
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return { city: 'Unknown', country: 'Unknown', resolved: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) {
      return { city: 'Unknown', country: 'Unknown', resolved: false };
    }

    const context = feature.context || [];
    const getContext = (prefix) => context.find((item) => item.id?.startsWith(`${prefix}.`));
    const placeLike =
      getContext('place') ||
      getContext('locality') ||
      getContext('district') ||
      (feature.place_type?.includes('place') ? feature : null);
    const region = getContext('region');
    const country = getContext('country');

    return {
      city: placeLike?.text || region?.text || feature.text || 'Unknown',
      country: country?.text || region?.text || 'Unknown',
      resolved: true,
    };
  } catch (error) {
    return { city: 'Unknown', country: 'Unknown', resolved: false, error: error.message };
  }
}

async function main() {
  const parsed = Papa.parse(rawCsv.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const nodes = [];
  const skipped = [];
  let counter = 0;

  for (const row of parsed.data) {
    const name = (row.name || '').trim();
    const latitude = Number.parseFloat((row.latitude || '').trim());
    const longitude = Number.parseFloat((row.longitude || '').trim());

    if (!name) {
      skipped.push({ reason: 'missing-name', row });
      continue;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      skipped.push({ reason: 'invalid-coordinates', row });
      continue;
    }

    if (Math.abs(latitude) <= 1 && Math.abs(longitude) <= 1) {
      skipped.push({ reason: 'placeholder-coordinates', row });
      continue;
    }

    counter += 1;
    const id = `zostel-${String(counter).padStart(3, '0')}`;

    const geo = await reverseGeocode(latitude, longitude);
    if (!geo.resolved && geo.error) {
      console.warn(`⚠️ Reverse geocode failed for ${name}: ${geo.error}`);
    }

    nodes.push({
      id,
      name,
      type: 'staynode',
      description: 'Stay node imported from Zostel network.',
      city: geo.city,
      country: geo.country,
      latitude,
      longitude,
      website: null,
      twitter: null,
      features: ['Stay'],
      status: 'active',
      image: null,
      contact_email: null,
    });
  }

  console.log(`Prepared ${nodes.length} staynodes. Skipped ${skipped.length}.`);
  if (skipped.length) {
    console.log('Skipped rows:', skipped.map((s) => ({ reason: s.reason, name: s.row.name, latitude: s.row.latitude, longitude: s.row.longitude })));
  }

  if (!nodes.length) {
    console.log('No nodes to upsert.');
    return;
  }

  if (supabaseUrl && serviceKey) {
    const client = createClient(supabaseUrl, serviceKey);
    const { error } = await client.from('nodes').upsert(nodes, { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert failed:', error.message);
      process.exitCode = 1;
    } else {
      console.log('Upserted nodes into Supabase.');
    }
  } else {
    console.log('\nNo service role credentials detected. Printing payload instead:\n');
    console.log(JSON.stringify(nodes, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
