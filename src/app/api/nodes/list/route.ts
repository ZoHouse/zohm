import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .order('name');

    if (error) {
      if ((error as any).code === 'PGRST116' || (error as any).message?.includes('does not exist')) {
        return NextResponse.json({ ok: true, nodes: [], note: 'nodes table not found yet' }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, nodes: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


