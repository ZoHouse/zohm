import { NextRequest, NextResponse } from 'next/server';
import { hasServiceRole, supabaseAdmin } from '@/lib/supabaseAdmin';
import { NodeType } from '@/lib/supabase';
import { ZoneType } from '@/lib/nodeTypes';

// Node data
interface NodeInput {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  website?: string | null;
  twitter?: string | null;
  status: 'active' | 'developing' | 'planning';
  image?: string | null;
  contact_email?: string | null;
  address?: string | null;
  instagram?: string | null;
  phone?: string | null;
}

// Zone data
interface ZoneInput {
  node_id: string;
  zone_type: ZoneType;
  name: string;
  description?: string;
  capacity?: number;
  floor?: string;
  is_available?: boolean;
}

export async function POST(_req: NextRequest) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // BLRxZo - Zo House Bangalore (flagship location)
    const nodes: NodeInput[] = [
      {
        id: 'blrxzo',
        name: 'BLRxZo',
        type: 'zo_house',
        description: 'The flagship Zo House in Koramangala, Bangalore. A 24/7 creative sanctuary for builders, artists, and conscious explorers.',
        city: 'Bangalore',
        country: 'India',
        latitude: 12.932658,
        longitude: 77.634402,
        website: 'https://zo.xyz',
        status: 'active',
        address: '33, 80 Feet Rd, Koramangala 4th Block, Koramangala, Bengaluru, Karnataka 560034',
        instagram: '@zo.house',
        phone: '+91 80 4567 8900',
      },
    ];

    // All 13 zones for BLRxZo
    const zones: ZoneInput[] = [
      {
        node_id: 'blrxzo',
        zone_type: 'schelling_point',
        name: 'The Schelling Point',
        description: 'Main coordination and event space. Where the community gathers for talks, workshops, and spontaneous collisions.',
        capacity: 100,
        floor: 'Ground Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'degen_lounge',
        name: 'Degen Lounge',
        description: 'Social space for traders, crypto enthusiasts, and late-night builders. Screens, charts, and vibes.',
        capacity: 30,
        floor: 'Ground Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'zo_studio',
        name: 'Zo Studio',
        description: 'Professional recording and production studio for podcasts, music, and content creation.',
        capacity: 6,
        floor: '1st Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'flo_zone',
        name: 'Flo Zone',
        description: 'Silent deep work space. No calls, no meetings, just flow state.',
        capacity: 40,
        floor: '1st Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'liquidity_pool',
        name: 'Liquidity Pool',
        description: 'Rooftop pool and lounge area. Perfect for poolside calls and sunset vibes.',
        capacity: 20,
        floor: 'Rooftop',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'multiverse',
        name: 'The Multiverse',
        description: 'Flexible multi-purpose space that transforms for different needs - meetings, workshops, or chill sessions.',
        capacity: 25,
        floor: '2nd Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'battlefield',
        name: 'The Battlefield',
        description: 'Gaming and competition zone. Consoles, PCs, and tournament-ready setup.',
        capacity: 16,
        floor: 'Basement',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'bio_hack',
        name: 'Bio Hack Lab',
        description: 'Health optimization zone with cold plunge, sauna, and biohacking equipment.',
        capacity: 8,
        floor: 'Ground Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'zo_cafe',
        name: 'Zo Cafe',
        description: 'In-house cafe serving specialty coffee, healthy meals, and midnight snacks for builders.',
        capacity: 35,
        floor: 'Ground Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: '420',
        name: '420 Terrace',
        description: 'Designated smoking area with comfortable seating and good ventilation.',
        capacity: 10,
        floor: 'Terrace',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'showcase',
        name: 'The Showcase',
        description: 'Gallery and exhibition space for art, prototypes, and community projects.',
        capacity: 40,
        floor: 'Ground Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'dorms',
        name: 'Dorms',
        description: 'Shared dormitory-style accommodation for short-term stays and community members.',
        capacity: 24,
        floor: '3rd Floor',
        is_available: true,
      },
      {
        node_id: 'blrxzo',
        zone_type: 'private_rooms',
        name: 'Private Rooms',
        description: 'Private rooms for longer stays and members who need their own space.',
        capacity: 12,
        floor: '3rd Floor',
        is_available: true,
      },
    ];

    // Clear and replace nodes
    const { error: deleteNodesError } = await supabaseAdmin.from('nodes').delete().neq('id', '__keep_none__');
    if (deleteNodesError) {
      return NextResponse.json({ error: 'Delete nodes: ' + deleteNodesError.message }, { status: 500 });
    }

    const { error: insertNodesError } = await supabaseAdmin.from('nodes').insert(nodes);
    if (insertNodesError) {
      return NextResponse.json({ error: 'Insert nodes: ' + insertNodesError.message }, { status: 500 });
    }

    // Clear and replace zones
    const { error: deleteZonesError } = await supabaseAdmin.from('node_zones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteZonesError) {
      return NextResponse.json({ error: 'Delete zones: ' + deleteZonesError.message }, { status: 500 });
    }

    const { error: insertZonesError } = await supabaseAdmin.from('node_zones').insert(zones);
    if (insertZonesError) {
      return NextResponse.json({ error: 'Insert zones: ' + insertZonesError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      node: 'blrxzo',
      zonesCount: zones.length,
      message: 'BLRxZo with all 13 zones created successfully'
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
