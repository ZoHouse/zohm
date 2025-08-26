import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: false, deprecated: true, message: 'Use /api/nodes/replace to manage nodes.' }, { status: 410 });
}


