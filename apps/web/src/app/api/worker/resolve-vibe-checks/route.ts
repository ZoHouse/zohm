/**
 * Vibe Check Resolution Worker
 *
 * Cron endpoint that resolves expired vibe checks every 15 minutes.
 * Follows the worker/sync-events pattern.
 *
 * POST /api/worker/resolve-vibe-checks — run resolution
 * GET  /api/worker/resolve-vibe-checks — status check
 */

import { NextResponse } from 'next/server';
import { isVibeCheckEnabled, getFeatureFlagState } from '@/lib/featureFlags';
import { resolveExpiredVibeChecks } from '@/lib/telegram/vibeCheck';
import { devLog } from '@/lib/logger';

export async function POST() {
  try {
    if (!isVibeCheckEnabled()) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'VIBE_CHECK_TELEGRAM feature flag is disabled',
        timestamp: new Date().toISOString(),
      });
    }

    devLog.log('🔄 Vibe check resolution worker triggered');

    const startTime = Date.now();
    const stats = await resolveExpiredVibeChecks();
    const duration = Date.now() - startTime;

    devLog.log('✅ Vibe check resolution completed', { stats, duration_ms: duration });

    return NextResponse.json({
      success: true,
      stats,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    devLog.error('❌ Vibe check resolution failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  const flagState = getFeatureFlagState();

  return NextResponse.json({
    status: 'ready',
    worker: 'resolve-vibe-checks',
    enabled: isVibeCheckEnabled(),
    feature_flags: flagState.vibeCheck,
    usage: {
      trigger: 'POST /api/worker/resolve-vibe-checks',
      status: 'GET /api/worker/resolve-vibe-checks',
    },
    timestamp: new Date().toISOString(),
  });
}
