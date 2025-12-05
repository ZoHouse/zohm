/**
 * Event Worker API Endpoint
 * 
 * Triggers canonical event sync (dry-run or apply mode)
 * 
 * Usage:
 *   POST /api/worker/sync-events
 *   POST /api/worker/sync-events?apply=true
 *   POST /api/worker/sync-events?calendar=cal-123
 * 
 * Security: Add authentication in production!
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncCanonicalEvents } from '@/lib/eventWorker';
import { getFeatureFlagState } from '@/lib/featureFlags';
import { devLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const forceApply = searchParams.get('apply') === 'true';
    const calendarId = searchParams.get('calendar') || undefined;
    const verbose = searchParams.get('verbose') === 'true';
    
    // Log worker start
    devLog.log('🔄 Event worker triggered via API', {
      forceApply,
      calendarId,
      verbose,
      timestamp: new Date().toISOString(),
    });
    
    // Get current feature flag state
    const flagState = getFeatureFlagState();
    
    // Run sync
    const startTime = Date.now();
    const stats = await syncCanonicalEvents({
      dryRun: !forceApply, // Override with query param if provided
      calendarId,
      verbose,
    });
    const duration = Date.now() - startTime;
    
    // Log completion
    devLog.log('✅ Event worker completed', {
      stats,
      duration_ms: duration,
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      stats,
      duration_ms: duration,
      config: {
        dry_run: stats.dryRunOnly,
        calendar_filter: calendarId || 'all',
        feature_flags: flagState.canonicalEvents,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    devLog.error('❌ Event worker failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
}

/**
 * GET endpoint for status check
 */
export async function GET() {
  const flagState = getFeatureFlagState();
  
  return NextResponse.json({
    status: 'ready',
    worker: 'canonical-events-sync',
    feature_flags: flagState.canonicalEvents,
    usage: {
      trigger_sync: 'POST /api/worker/sync-events',
      dry_run: 'POST /api/worker/sync-events (default)',
      apply_mode: 'POST /api/worker/sync-events?apply=true',
      single_calendar: 'POST /api/worker/sync-events?calendar=cal-123',
      verbose_logs: 'POST /api/worker/sync-events?verbose=true',
    },
    timestamp: new Date().toISOString(),
  });
}





