/**
 * Feature Flags for Zo World
 * 
 * Centralized feature flag management for gradual rollouts and A/B testing.
 * All flags default to safe/conservative values.
 */

import { devLog } from '@/lib/logger';

/**
 * Canonical Events Store Flags
 * 
 * Controls rollout of new event storage system:
 * - READ: Where UI fetches event data from
 * - WRITE: Whether worker populates canonical_events table
 * - DRY_RUN: Safety mode for worker (log only, no writes)
 */
export const FEATURE_FLAGS = {
  /**
   * CANONICAL_EVENTS_READ
   * 
   * When true: UI fetches events from /api/events/canonical (database)
   * When false: UI uses legacy iCal parser (client-side)
   * 
   * Rollout plan:
   * 1. false (all users on legacy)
   * 2. true for 10% (A/B test)
   * 3. true for 50% (gradual rollout)
   * 4. true for 100% (full migration)
   * 
   * Default: false (safe)
   */
  CANONICAL_EVENTS_READ: process.env.FEATURE_CANONICAL_EVENTS_READ === 'true',

  /**
   * CANONICAL_EVENTS_WRITE
   * 
   * When true: Worker writes to canonical_events table
   * When false: Worker runs in dry-run mode (audit only)
   * 
   * Rollout plan:
   * 1. false (dry-run in staging for 72h)
   * 2. true in staging (validate inserts for 24h)
   * 3. true in prod (warm cache for 48h with READ=false)
   * 4. Enable READ flag after cache warm
   * 
   * Default: false (safe)
   */
  CANONICAL_EVENTS_WRITE: process.env.FEATURE_CANONICAL_EVENTS_WRITE === 'true',

  /**
   * CANONICAL_DRY_RUN
   * 
   * When true: Worker logs operations to canonical_event_changes but doesn't modify canonical_events
   * When false: Worker performs real inserts/updates
   * 
   * This is an additional safety layer on top of WRITE flag.
   * Useful for testing worker logic without affecting production data.
   * 
   * Default: true (safest)
   */
  CANONICAL_DRY_RUN: process.env.CANONICAL_DRY_RUN !== 'false', // default true

  /**
   * LUMA_API_SYNC
   *
   * When true: Enables bidirectional Luma API integration
   *   - Read: Pull events from Luma API (replaces iCal for configured calendars)
   *   - Write: Push approved community events to Luma
   *   - RSVP: Sync RSVPs between platforms
   *   - Webhooks: Receive real-time updates from Luma
   * When false: All Luma API features disabled, iCal-only mode
   *
   * Default: false (safe)
   */
  LUMA_API_SYNC: process.env.FEATURE_LUMA_API_SYNC === 'true',

  /**
   * VIBE_CHECK_TELEGRAM
   *
   * When true: Pending community events trigger a Telegram vibe check
   *   - Bot posts a rich card to a Telegram group
   *   - Members vote with inline buttons (upvote/downvote)
   *   - After 24h, majority decides approval/rejection
   *   - Cron worker resolves expired vibe checks every 15 min
   * When false: Pending events sit in DB with no review flow
   *
   * Default: false (safe)
   */
  VIBE_CHECK_TELEGRAM: process.env.FEATURE_VIBE_CHECK_TELEGRAM === 'true',

  /**
   * EVENT_INQUIRY_PIPELINE
   *
   * When true: Enables the sponsored event inquiry pipeline
   *   - Typeform webhook receives inquiry submissions
   *   - Venue matcher scores against Zoeventsmaster
   *   - Bot posts inquiry summary to Telegram group
   *   - Team can generate quotes via inline button
   *   - Quote email sent to inquirer via Resend
   * When false: Typeform submissions are not processed
   *
   * Default: false (safe)
   */
  EVENT_INQUIRY_PIPELINE: process.env.FEATURE_EVENT_INQUIRY_PIPELINE === 'true',
} as const;

/**
 * Helper to check if canonical events system is fully enabled
 */
export function isCanonicalEventsEnabled(): boolean {
  return FEATURE_FLAGS.CANONICAL_EVENTS_READ && FEATURE_FLAGS.CANONICAL_EVENTS_WRITE;
}

/**
 * Helper to check if worker should perform real writes
 */
export function shouldWorkerWrite(): boolean {
  return FEATURE_FLAGS.CANONICAL_EVENTS_WRITE && !FEATURE_FLAGS.CANONICAL_DRY_RUN;
}

/**
 * Helper to check if Luma API sync is enabled
 */
export function isLumaApiEnabled(): boolean {
  return FEATURE_FLAGS.LUMA_API_SYNC;
}

/**
 * Helper to check if Telegram vibe check is enabled
 */
export function isVibeCheckEnabled(): boolean {
  return FEATURE_FLAGS.VIBE_CHECK_TELEGRAM;
}

/**
 * Helper to check if event inquiry pipeline is enabled
 */
export function isInquiryPipelineEnabled(): boolean {
  return FEATURE_FLAGS.EVENT_INQUIRY_PIPELINE;
}

/**
 * Get current feature flag state (for debugging/monitoring)
 */
export function getFeatureFlagState() {
  return {
    canonicalEvents: {
      read: FEATURE_FLAGS.CANONICAL_EVENTS_READ,
      write: FEATURE_FLAGS.CANONICAL_EVENTS_WRITE,
      dryRun: FEATURE_FLAGS.CANONICAL_DRY_RUN,
      fullyEnabled: isCanonicalEventsEnabled(),
      workerWriting: shouldWorkerWrite(),
    },
    luma: {
      apiSync: FEATURE_FLAGS.LUMA_API_SYNC,
    },
    vibeCheck: {
      telegram: FEATURE_FLAGS.VIBE_CHECK_TELEGRAM,
    },
    inquiryPipeline: {
      enabled: FEATURE_FLAGS.EVENT_INQUIRY_PIPELINE,
    },
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log feature flag state on startup (useful for debugging)
 */
if (typeof window === 'undefined') {
  // Server-side only logging
  const state = getFeatureFlagState();
  devLog.log('🚩 Feature Flags Initialized:', JSON.stringify(state, null, 2));
}





