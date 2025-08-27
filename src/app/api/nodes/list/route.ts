import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .order('name');

    if (error) {
      const code = (error as { code?: string; message?: string }).code;
      const message = (error as { code?: string; message?: string }).message;
      if (code === 'PGRST116' || message?.includes('does not exist')) {
        return NextResponse.json({ ok: true, nodes: [], note: 'nodes table not found yet' }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, nodes: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


