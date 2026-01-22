import { NextRequest, NextResponse } from 'next/server';
import { hasServiceRole, supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    // Use admin client if available (bypasses RLS), otherwise fall back to anon
    const client = hasServiceRole && supabaseAdmin ? supabaseAdmin : supabase;
    const usingAdmin = hasServiceRole && supabaseAdmin ? true : false;

    const { data, error, count } = await client
      .from('nodes')
      .select('*', { count: 'exact' })
      .order('name');

    if (error) {
      const code = (error as { code?: string; message?: string }).code;
      const message = (error as { code?: string; message?: string }).message;
      if (code === 'PGRST116' || message?.includes('does not exist')) {
        return NextResponse.json({ ok: true, nodes: [], note: 'nodes table not found yet' }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, nodes: data ?? [], count, usingAdmin });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


