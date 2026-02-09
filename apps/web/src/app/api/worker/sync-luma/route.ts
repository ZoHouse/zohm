/**
 * Luma Sync Worker API Endpoint
 *
 * Triggers Luma → canonical_events sync (dry-run or apply mode).
 * Follows the same pattern as sync-events/route.ts.
 *
 * Usage:
 *   POST /api/worker/sync-luma                    (dry-run)
 *   POST /api/worker/sync-luma?apply=true          (write to DB)
 *   POST /api/worker/sync-luma?calendar=blr        (single calendar)
 *   POST /api/worker/sync-luma?verbose=true         (detailed logs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncLumaEvents } from '@/lib/luma/syncWorker';
import { getFeatureFlagState } from '@/lib/featureFlags';
import { devLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const forceApply = searchParams.get('apply') === 'true';
    const calendar = searchParams.get('calendar') || undefined;
    const verbose = searchParams.get('verbose') === 'true';

    // Log worker start
    devLog.log('[Luma Worker] Triggered via API', {
      forceApply,
      calendar,
      verbose,
      timestamp: new Date().toISOString(),
    });

    // Get current feature flag state
    const flagState = getFeatureFlagState();

    // Run sync
    const startTime = Date.now();
    const stats = await syncLumaEvents({
      dryRun: !forceApply,
      calendar,
      verbose,
    });
    const duration = Date.now() - startTime;

    // Log completion
    devLog.log('[Luma Worker] Completed', {
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
        calendar_filter: calendar || 'all',
        feature_flags: flagState.luma,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    devLog.error('[Luma Worker] Failed:', error);

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
    worker: 'luma-events-sync',
    feature_flags: flagState.luma,
    usage: {
      trigger_sync: 'POST /api/worker/sync-luma',
      dry_run: 'POST /api/worker/sync-luma (default)',
      apply_mode: 'POST /api/worker/sync-luma?apply=true',
      single_calendar: 'POST /api/worker/sync-luma?calendar=blr',
      verbose_logs: 'POST /api/worker/sync-luma?verbose=true',
    },
    timestamp: new Date().toISOString(),
  });
}
