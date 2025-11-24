import { NextRequest, NextResponse } from 'next/server';
import { hasServiceRole, supabaseAdmin } from '@/lib/supabaseAdmin';
import { PartnerNodeRecord } from '@/lib/supabase';

export async function POST(_req: NextRequest) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // 🦄 UNICORN: SF-focused nodes for the Bay Area crypto/tech scene
    const rows: PartnerNodeRecord[] = [
      {
        id: 'zo-sf',
        name: 'Zo House San Francisco',
        type: 'culture_house',
        description: 'West Coast hub for tech builders and consciousness explorers in SOMA.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7817309,
        longitude: -122.401198,
        website: 'https://zo.house',
        twitter: '@zohousesf',
        features: ['Co-living', 'Co-working', 'Investor Network', 'Art Studios'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'noisebridge',
        name: 'Noisebridge',
        type: 'hacker_space',
        description: 'SF\'s legendary anarchist hacker space and community workshop.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7626,
        longitude: -122.4194,
        website: 'https://www.noisebridge.net',
        twitter: '@noisebridge',
        features: ['Hackathons', 'Workshops', 'Open Source', '24/7 Access'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'the-archive',
        name: 'The Archive',
        type: 'culture_house',
        description: 'Mission district hacker house and creative collective.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7599,
        longitude: -122.4148,
        website: null,
        twitter: null,
        features: ['Co-living', 'Builders', 'Art', 'Community'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'react',
        name: 'ReAct',
        type: 'flo_zone',
        description: 'Coworking space for builders and creators in Hayes Valley.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7764,
        longitude: -122.4242,
        website: null,
        twitter: null,
        features: ['Coworking', 'Focus', 'Community', 'Events'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'crypto-commons',
        name: 'Crypto Commons',
        type: 'hacker_space',
        description: 'Web3 community space in the heart of SF.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7899,
        longitude: -122.4094,
        website: null,
        twitter: null,
        features: ['Web3', 'Workshops', 'Community', 'Events'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'hackerdojo',
        name: 'Hacker Dojo',
        type: 'hacker_space',
        description: 'Mountain View hacker space for Silicon Valley builders.',
        city: 'Mountain View',
        country: 'USA',
        latitude: 37.4027,
        longitude: -122.0679,
        website: 'https://www.hackerdojo.com',
        twitter: '@hackerdojo',
        features: ['Coworking', 'Events', 'Workshops', '24/7 Access'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'founder-house-sf',
        name: 'Founder House SF',
        type: 'culture_house',
        description: 'Exclusive co-living for YC founders and startup builders.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7866,
        longitude: -122.4090,
        website: null,
        twitter: null,
        features: ['Co-living', 'Startups', 'Networking', 'Events'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'impact-hub-sf',
        name: 'Impact Hub SF',
        type: 'flo_zone',
        description: 'Coworking space for social entrepreneurs in Mid-Market.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7815,
        longitude: -122.4134,
        website: 'https://sanfrancisco.impacthub.net',
        twitter: '@ImpactHubSF',
        features: ['Coworking', 'Social Impact', 'Community', 'Events'],
        status: 'active',
        image: null,
        contact_email: null,
      },
    ];

    const ids = rows.map(r => r.id);

    // Replace strategy: clear all, then upsert desired rows
    const { error: deleteAllError } = await supabaseAdmin.from('nodes').delete().neq('id', '__keep_none__');
    if (deleteAllError) {
      return NextResponse.json({ error: deleteAllError.message }, { status: 500 });
    }

    const { error: upsertError } = await supabaseAdmin.from('nodes').upsert(rows, { onConflict: 'id' });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, kept: ids, count: rows.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


