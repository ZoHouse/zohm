import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('id');
    const directUrl = searchParams.get('url');
    
    let fetchUrl: string;
    
    if (directUrl) {
      // Direct URL provided (for external iCal feeds)
      fetchUrl = decodeURIComponent(directUrl);
      devLog.log('🔄 Fetching direct calendar:', fetchUrl);
    } else if (calendarId) {
      // Luma calendar ID provided (legacy format)
      fetchUrl = `https://api.lu.ma/ics/get?entity=calendar&id=${calendarId}`;
      devLog.log('🔄 Fetching Luma calendar:', fetchUrl);
    } else {
      return NextResponse.json({ error: 'Calendar ID or URL is required' }, { status: 400 });
    }
    
    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': 'text/calendar, text/plain, */*',
        'User-Agent': 'Zo-House-Calendar/1.0'
      }
    });
    
    if (!response.ok) {
      devLog.error('❌ Failed to fetch calendar:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch calendar: ${response.status}` }, 
        { status: response.status }
      );
    }
    
    const icalData = await response.text();
    
    if (!icalData.includes('BEGIN:VCALENDAR')) {
      devLog.error('❌ Invalid iCal data received');
      return NextResponse.json(
        { error: 'Invalid calendar data received' }, 
        { status: 500 }
      );
    }
    
    devLog.log('✅ Successfully fetched calendar data:', icalData.length, 'characters');
    
    return new NextResponse(icalData, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    devLog.error('❌ Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 