import { NextResponse } from 'next/server';
import { addCalendar } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, type, description } = body;
    
    if (!name || !url || !type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, url, type' 
      }, { status: 400 });
    }
    
    const result = await addCalendar({
      name,
      url,
      type,
      description,
      is_active: true
    });
    
    if (!result) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to add calendar' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Calendar added successfully',
      calendar: result
    });
    
  } catch (error) {
    console.error('❌ Add calendar error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
