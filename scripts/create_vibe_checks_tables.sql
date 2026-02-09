-- Vibe Check Tables
-- Run this in the Supabase SQL Editor
--
-- Creates tables for the Telegram vibe check system:
--   vibe_checks      — one row per pending event sent to TG
--   vibe_check_votes — one row per user vote (UNIQUE per user per check)

CREATE TABLE IF NOT EXISTS vibe_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES canonical_events(id) ON DELETE CASCADE,
  tg_chat_id      TEXT NOT NULL,
  tg_message_id   INTEGER,
  tg_message_type TEXT DEFAULT 'text',
  upvotes         INTEGER DEFAULT 0,
  downvotes       INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vibe_checks_status_expires ON vibe_checks(status, expires_at);

CREATE TABLE IF NOT EXISTS vibe_check_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_check_id   UUID NOT NULL REFERENCES vibe_checks(id) ON DELETE CASCADE,
  tg_user_id      TEXT NOT NULL,
  vote            TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vibe_check_id, tg_user_id)
);
