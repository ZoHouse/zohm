/**
 * Feature Flags for Zo World
 * 
 * Centralized feature flag management for gradual rollouts and A/B testing.
 * All flags default to safe/conservative values.
 */

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
  console.log('🚩 Feature Flags Initialized:', JSON.stringify(state, null, 2));
}





