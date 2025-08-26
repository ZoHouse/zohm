import { NextRequest, NextResponse } from 'next/server';
import { hasServiceRole, supabaseAdmin } from '@/lib/supabaseAdmin';
import { createNodesTableSQL, PartnerNodeRecord } from '@/lib/supabase';
import { PARTNER_NODES } from '@/lib/partnerNodes';

export async function POST(_req: NextRequest) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // Attempt upsert directly; if table missing, return SQL to create
    const rows: PartnerNodeRecord[] = PARTNER_NODES.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type as PartnerNodeRecord['type'],
      description: n.description,
      city: n.location.city,
      country: n.location.country,
      latitude: n.location.latitude,
      longitude: n.location.longitude,
      website: n.website ?? null,
      twitter: n.social?.twitter ?? null,
      features: n.features,
      status: n.status as PartnerNodeRecord['status'],
      image: n.image ?? null,
      contact_email: n.contactEmail ?? null,
      
    } as unknown as PartnerNodeRecord));

    const { error } = await supabaseAdmin.from('nodes').upsert(rows, { onConflict: 'id' });
    if (error) {
      if ((error as any).code === 'PGRST116' || (error as any).message?.includes('does not exist')) {
        return NextResponse.json({ ok: false, needsSetup: true, sql: createNodesTableSQL }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


