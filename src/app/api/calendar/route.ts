import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('id');
    
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 });
    }
    
    const lumaUrl = `https://api.lu.ma/ics/get?entity=calendar&id=${calendarId}`;
    
    console.log('🔄 Fetching calendar:', lumaUrl);
    
    const response = await fetch(lumaUrl, {
      headers: {
        'Accept': 'text/calendar, text/plain, */*',
        'User-Agent': 'Zo-House-Calendar/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch calendar:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch calendar: ${response.status}` }, 
        { status: response.status }
      );
    }
    
    const icalData = await response.text();
    
    if (!icalData.includes('BEGIN:VCALENDAR')) {
      console.error('❌ Invalid iCal data received');
      return NextResponse.json(
        { error: 'Invalid calendar data received' }, 
        { status: 500 }
      );
    }
    
    console.log('✅ Successfully fetched calendar data:', icalData.length, 'characters');
    
    return new NextResponse(icalData, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('❌ Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 