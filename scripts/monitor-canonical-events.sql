-- ============================================================================
-- Canonical Events Monitoring Queries
-- Use these to track system health and performance
-- ============================================================================

-- ============================================================================
-- 1. Event Insert Rate (events per hour for last 24h)
-- ============================================================================
SELECT 
  date_trunc('hour', created_at) AS hour,
  COUNT(*) AS events_inserted
FROM canonical_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- ============================================================================
-- 2. Geocoding Cache Hit Rate
-- ============================================================================
SELECT 
  geocode_status,
  COUNT(*) AS count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM canonical_events) * 100, 2) AS percentage
FROM canonical_events
GROUP BY geocode_status
ORDER BY count DESC;

-- ============================================================================
-- 3. Duplicate Detection Rate (should be near 0%)
-- ============================================================================
SELECT 
  canonical_uid,
  COUNT(*) AS occurrence_count,
  array_agg(title) AS event_titles
FROM canonical_events
GROUP BY canonical_uid
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- ============================================================================
-- 4. Worker Activity (change log over last 7 days)
-- ============================================================================
SELECT 
  date_trunc('day', created_at) AS day,
  change_type,
  COUNT(*) AS count
FROM canonical_event_changes
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY day, change_type
ORDER BY day DESC, change_type;

-- ============================================================================
-- 5. Events by Source (where are events coming from?)
-- ============================================================================
SELECT 
  jsonb_array_length(source_refs) AS source_count,
  COUNT(*) AS event_count
FROM canonical_events
GROUP BY source_count
ORDER BY source_count DESC;

-- ============================================================================
-- 6. Upcoming Events (next 30 days)
-- ============================================================================
SELECT 
  COUNT(*) AS upcoming_events,
  MIN(starts_at) AS next_event,
  MAX(starts_at) AS latest_event
FROM canonical_events
WHERE starts_at >= NOW()
  AND starts_at <= NOW() + INTERVAL '30 days';

-- ============================================================================
-- 7. Geocoding Failures (events that need manual review)
-- ============================================================================
SELECT 
  id,
  title,
  location_raw,
  geocode_status,
  geocode_attempted_at
FROM canonical_events
WHERE geocode_status = 'failed'
  AND starts_at >= NOW() -- Only future events
ORDER BY starts_at ASC
LIMIT 20;

-- ============================================================================
-- 8. Recent Changes (audit trail)
-- ============================================================================
SELECT 
  ce.change_type,
  ce.payload->>'event_name' AS event_name,
  ce.payload->>'action' AS action,
  ce.created_at
FROM canonical_event_changes ce
ORDER BY ce.created_at DESC
LIMIT 50;

-- ============================================================================
-- 9. Database Size & Performance
-- ============================================================================
SELECT 
  'canonical_events' AS table_name,
  pg_size_pretty(pg_total_relation_size('canonical_events')) AS total_size,
  (SELECT COUNT(*) FROM canonical_events) AS row_count
UNION ALL
SELECT 
  'canonical_event_changes' AS table_name,
  pg_size_pretty(pg_total_relation_size('canonical_event_changes')) AS total_size,
  (SELECT COUNT(*) FROM canonical_event_changes) AS row_count;

-- ============================================================================
-- 10. Index Usage (ensure indexes are being used)
-- ============================================================================
SELECT 
  indexrelname AS index_name,
  idx_scan AS times_used,
  idx_tup_read AS rows_read,
  idx_tup_fetch AS rows_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE '%canonical_events%'
ORDER BY idx_scan DESC;

-- ============================================================================
-- 11. Slow Queries (if pg_stat_statements enabled)
-- ============================================================================
-- SELECT 
--   query,
--   calls,
--   mean_exec_time,
--   max_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%canonical_events%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- ============================================================================
-- 12. Timezone Distribution (which TZs are most common?)
-- ============================================================================
SELECT 
  tz,
  COUNT(*) AS event_count
FROM canonical_events
GROUP BY tz
ORDER BY event_count DESC;

-- ============================================================================
-- 13. Events Needing Geocoding (pending status)
-- ============================================================================
SELECT 
  COUNT(*) AS pending_geocode,
  MIN(created_at) AS oldest_pending
FROM canonical_events
WHERE geocode_status = 'pending';

-- ============================================================================
-- 14. Worker Error Rate (from dry-run logs)
-- ============================================================================
SELECT 
  DATE(created_at) AS date,
  COUNT(*) FILTER (WHERE payload->>'action' = 'error') AS errors,
  COUNT(*) AS total_operations,
  ROUND(
    COUNT(*) FILTER (WHERE payload->>'action' = 'error')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) AS error_rate_percent
FROM canonical_event_changes
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

