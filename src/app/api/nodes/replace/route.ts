import { NextRequest, NextResponse } from 'next/server';
import { hasServiceRole, supabaseAdmin } from '@/lib/supabaseAdmin';
import { PartnerNodeRecord } from '@/lib/supabase';

export async function POST(_req: NextRequest) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // Desired set: Circle Work (flo_zone) + three Zo Houses
    const rows: PartnerNodeRecord[] = [
      {
        id: 'circle-work',
        name: 'Circle Work',
        type: 'flo_zone',
        description: 'Coworking zone focused on flow, collaboration, and deep work.',
        city: '—',
        country: '—',
        latitude: 28.5396408,
        longitude: 77.2039967,
        website: 'https://share.google/TLA8bZqK9vUAoMvhj',
        twitter: null,
        features: ['Coworking', 'Focus', 'Community'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'eth-global',
        name: 'ETH Global',
        type: 'hacker_space',
        description: 'Global hacker space and builder network anchored by ETHGlobal events.',
        city: 'Global',
        country: '—',
        latitude: 28.5551671,
        longitude: 76.9657856,
        website: 'https://maps.app.goo.gl/h4tpM6ywf6vtdAsGA',
        twitter: null,
        features: ['Hackathon', 'Builders', 'Community'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'zo-koramangala',
        name: 'Zo House Koramangala',
        type: 'culture_house',
        description: 'Flagship Zo House in Bengaluru for builders and creators.',
        city: 'Bengaluru',
        country: 'India',
        latitude: 12.933043207450986,
        longitude: 77.63463845876512,
        website: 'https://zo.house',
        twitter: null,
        features: ['Co-living', 'Co-working', 'Events', 'Wellness'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'zo-sf',
        name: 'Zo House San Francisco',
        type: 'culture_house',
        description: 'West Coast node for tech builders and consciousness explorers.',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.781903723962394,
        longitude: -122.40089759537564,
        website: 'https://zo.house',
        twitter: '@zohousesf',
        features: ['Co-living', 'Co-working', 'Investor Network', 'Art Studios'],
        status: 'active',
        image: null,
        contact_email: null,
      },
      {
        id: 'zo-whitefield',
        name: 'Zo House Whitefield',
        type: 'culture_house',
        description: 'Zo House expansion hub in Whitefield, Bengaluru.',
        city: 'Bengaluru',
        country: 'India',
        latitude: 12.972625067533576,
        longitude: 77.74648576165846,
        website: 'https://zo.house',
        twitter: null,
        features: ['Co-living', 'Co-working', 'Events'],
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


