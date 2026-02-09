# Zo OS: Database Schema

> **Supabase-powered data layer for the Human Coordination Protocol.**

---

## Overview

| Category | Tables |
|----------|--------|
| **Master Database** | `master_users` (646K+ records) |
| **Directory Views** | Citizens Directory, Founders Directory |
| **Identity** | `users`, `members`, `user_wallets` |
| **Profile** | `user_reputations`, `user_streaks`, `user_inventory` |
| **Nodes** | `nodes`, `node_zones` |
| **Cities** | `cities`, `city_progress` |
| **Events** | `canonical_events`, `event_rsvps`, `vibe_checks`, `vibe_check_votes` |
| **Gamification** | `quests`, `completed_quests`, `quest_scores`, `user_quest_stats`, `leaderboards` |
| **Content** | `calendars` |

**Total**: 25+ tables and views

---

## Master Users Database

### master_users

**The source of truth for all Zo World users** — 646,804 records with comprehensive profiles.

| Field Category | Key Fields |
|----------------|------------|
| **Identity** | `id` (UUID), `zo_pid` (unique 8-char ID) |
| **Profile** | `nickname`, `full_name`, `display_name`, `bio`, `pfp`, `avatar_ref` |
| **Demographics** | `birthdate`, `gender`, `relationship_status`, `country`, `cultures` |
| **Email** | `email`, `email_verified`, `all_emails` (JSONB array) |
| **Phone** | `phone_country_code`, `phone_number`, `phone_full`, `phone_verified`, `has_whatsapp`, `all_phones` |
| **Wallet** | `wallet_address`, `wallet_verified`, `wallet_custodial`, `primary_wallet`, `all_wallets` |
| **Socials** | `socials` (JSONB - Twitter, Instagram, etc.) |
| **Membership** | `membership` (`founder`, `citizen`, `none`), `verified`, `founder_token_ids`, `is_founder`, `founder_tier` |
| **Luma Events** | `luma_api_id`, `luma_email`, `luma_data`, `event_count`, `events_attended`, `first_event_date`, `last_event_date` |
| **Telegram** | `telegram_id`, `telegram_username`, `telegram_data` |
| **Web3** | `zo_balance` (DECIMAL) |
| **Engagement** | `vibe_score`, `vibe_breakdown`, `tags`, `roles`, `badges` |
| **Travel** | `nodes_visited`, `quests_completed` |
| **System** | `data_sources`, `created_at`, `updated_at`, `synced_at`, `merged_into` |

#### Key Queries

```sql
-- All Founders (Citizens Directory filter)
SELECT * FROM master_users WHERE membership = 'founder';

-- All Citizens
SELECT * FROM master_users WHERE membership = 'citizen';

-- Verified Users
SELECT * FROM master_users WHERE verified = true;

-- Users with Luma Events
SELECT * FROM master_users WHERE luma_api_id IS NOT NULL ORDER BY event_count DESC;

-- Top Zo Balance Holders
SELECT zo_pid, display_name, zo_balance FROM master_users ORDER BY zo_balance DESC LIMIT 100;
```

---

## Directory Views

### Citizens Directory

All users with `membership = 'citizen'` — general community members.

| View Field | Source |
|------------|--------|
| Display Name | `display_name` or `nickname` |
| Avatar | `pfp` |
| City | From `country` + location |
| Events Attended | `event_count` |
| Verified | `verified` |

### Founders Directory  

All users with `membership = 'founder'` — Black Passport holders with NFTs.

| View Field | Source |
|------------|--------|
| Display Name | `display_name` or `nickname` |
| Avatar | `pfp` |
| Founder Tier | `founder_tier` |
| NFT Count | `jsonb_array_length(founder_token_ids)` |
| Zo Balance | `zo_balance` |
| Vibe Score | `vibe_score` |
| Events | `event_count` |

---

## Identity Tables

### users

Primary identity table — synced from ZO API.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (= zo_user_id) |
| `phone_number` | TEXT | Unique, hashed |
| `role` | TEXT | `citizen`, `member`, `founder`, `admin`, `vibe_curator` |
| `zo_membership` | TEXT | `free`, `member`, `founder` |
| `founder_nfts_count` | INTEGER | Number of Founder NFTs owned |
| `home_city_id` | TEXT | User's primary city |
| `onboarding_completed` | BOOLEAN | Has completed onboarding |
| `nickname` | TEXT | Display name |
| `avatar_url` | TEXT | Profile picture |
| `zo_token` | TEXT | ZO API access token |
| `zo_refresh_token` | TEXT | ZO API refresh token |
| `zo_device_id` | TEXT | Device identifier |
| `zo_device_secret` | TEXT | Device secret |
| `tg_user_id` | TEXT | Linked Telegram ID |
| `created_at` | TIMESTAMPTZ | Account creation |
| `last_seen` | TIMESTAMPTZ | Last activity |

---

### members

Extended profile data (wallet-connected users).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `wallet` | TEXT | Unique wallet address |
| `pfp` | TEXT | Profile picture URL |
| `name` | TEXT | Display name |
| `bio` | TEXT | User bio |
| `role` | TEXT | Display role |
| `email` | TEXT | Email address |
| `founder_nfts_count` | INTEGER | NFT count |
| `culture` | TEXT | Selected culture/community |
| `x_handle` | TEXT | X (Twitter) handle |
| `x_connected` | BOOLEAN | X account linked |
| `lat`, `lng` | FLOAT | Last known location |
| `calendar_url` | TEXT | Personal calendar |
| `last_seen` | TIMESTAMPTZ | Last activity |

---

### user_wallets

Links users to multiple wallet addresses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `user_id` | TEXT | → users.id |
| `wallet_address` | TEXT | Blockchain wallet |
| `chain` | TEXT | Chain type (ethereum, base, etc) |
| `is_primary` | BOOLEAN | Primary wallet flag |
| `created_at` | TIMESTAMPTZ | Link time |

---

## Profile Tables

### user_reputations

4-trait reputation scores.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | TEXT | → users.id |
| `city_id` | TEXT | → cities.id |
| `connectedness` | FLOAT | Social connections score |
| `knowledge` | FLOAT | Domain expertise score |
| `reputation` | FLOAT | Community standing score |
| `activity` | FLOAT | Engagement level score |
| `composite_score` | FLOAT | Weighted average |
| `updated_at` | TIMESTAMPTZ | Last calculation |

---

### user_streaks

Login and activity streaks.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | TEXT | → users.id |
| `streak_type` | TEXT | `login`, `quest`, `event`, `checkin` |
| `current_streak` | INTEGER | Current consecutive days |
| `longest_streak` | INTEGER | All-time best |
| `last_activity_at` | TIMESTAMPTZ | Last activity timestamp |
| `streak_updated_at` | TIMESTAMPTZ | Last streak update |

---

### user_inventory

User-owned items and collectibles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `user_id` | TEXT | → users.id |
| `item_type` | TEXT | Item category |
| `item_id` | TEXT | Specific item |
| `quantity` | INTEGER | Amount owned |
| `metadata` | JSONB | Item details |
| `acquired_at` | TIMESTAMPTZ | Acquisition time |

---

## Nodes Tables

### nodes

Physical and virtual locations in the Zo Network.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (slug) |
| `name` | TEXT | Display name |
| `type` | NodeType | See below |
| `status` | TEXT | `active`, `developing`, `planning` |
| `description` | TEXT | Node description |
| `city` | TEXT | City name |
| `country` | TEXT | Country |
| `latitude`, `longitude` | FLOAT | Coordinates |
| `address` | TEXT | Physical address |
| `website` | TEXT | URL |
| `twitter`, `instagram` | TEXT | Social links |
| `phone` | TEXT | Contact phone |
| `logo`, `image` | TEXT | Branding |
| `property_name` | TEXT | Full property name |
| `features` | TEXT[] | Feature array (deprecated) |
| `opening_hours` | JSONB | `{ "mon": "9-5", ... }` |
| `metadata` | JSONB | Custom data |

#### Node Types (19)

| Type | Icon | Description |
|------|------|-------------|
| `zo_house` | 🏠 | Zo House (flagship coliving) |
| `zostel` | 🏨 | Zostel hostel (124 locations) |
| `staynode` | 🏨 | Partner stay |
| `food` | 🍱 | Restaurant/cafe |
| `stay` | 🛏️ | Accommodation |
| `park` | 🌳 | Park/outdoor |
| `hospital` | 🏥 | Medical |
| `fire_station` | 🧯 | Emergency |
| `post_office` | 📮 | Postal |
| `bar` | 🍺 | Bar/nightlife |
| `metro` | 🚊 | Transit |
| `airport` | ✈️ | Airport |
| `shopping` | 🛍️ | Retail |
| `art` | 🎨 | Gallery/museum |
| `sports_arena` | 🏟️ | Sports venue |
| `arcade` | 🕹️ | Gaming |
| `library` | 📚 | Library |
| `gym` | 🏋️ | Fitness |
| `startup_hub` | 👨‍💻 | Coworking/incubator |

---

### node_zones

Zones within a node (spaces/amenities).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `node_id` | TEXT | → nodes.id |
| `zone_type` | ZoneType | See below |
| `name` | TEXT | Custom zone name |
| `description` | TEXT | Zone details |
| `capacity` | INTEGER | Max occupancy |
| `floor` | TEXT | Floor level |
| `is_available` | BOOLEAN | Currently available |
| `availability_notes` | TEXT | Hours/restrictions |
| `metadata` | JSONB | Custom data |

#### Zone Types (13)

| Zone | Description |
|------|-------------|
| `schelling_point` | Coordination/meeting space |
| `degen_lounge` | Social/trading culture space |
| `zo_studio` | Recording/production facility |
| `flo_zone` | Deep work/flow state workspace |
| `liquidity_pool` | Pool/water feature |
| `multiverse` | Multi-purpose flex space |
| `battlefield` | Competition/sports area |
| `bio_hack` | Health/fitness/biohacking |
| `zo_cafe` | Food/coffee service |
| `420` | Smoking-friendly space |
| `showcase` | Exhibition/display area |
| `dorms` | Shared accommodation |
| `private_rooms` | Private accommodation |

---

## Cities Tables

### cities

City-level coordination hubs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (slug) |
| `name` | TEXT | Display name |
| `country` | TEXT | Country |
| `latitude`, `longitude` | FLOAT | Center coordinates |
| `stage` | INTEGER | Development stage (1-5) |
| `tg_founders_chat_id` | TEXT | Telegram group ID |
| `tg_founders_group_name` | TEXT | TG group name |
| `metadata` | JSONB | Custom data |

---

### city_progress

City development metrics.

| Column | Type | Description |
|--------|------|-------------|
| `city_id` | TEXT | → cities.id |
| `total_citizens` | INTEGER | Registered users |
| `total_founders` | INTEGER | Founder count |
| `total_events` | INTEGER | Events hosted |
| `vibe_score` | FLOAT | City health score |
| `updated_at` | TIMESTAMPTZ | Last calculation |

---

## Events Tables

### canonical_events

All events in the system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `canonical_uid` | TEXT | Dedup key |
| `title` | TEXT | Event title |
| `description` | TEXT | Event description |
| `category` | TEXT | `community`, `sponsored`, `ticketed` |
| `culture` | TEXT | One of 19 cultures |
| `starts_at`, `ends_at` | TIMESTAMPTZ | Event times |
| `tz` | TEXT | Timezone |
| `location_type` | TEXT | `zo_property`, `custom`, `online` |
| `location_name` | TEXT | Venue name |
| `location_raw` | TEXT | Full address |
| `lat`, `lng` | FLOAT | Coordinates |
| `host_id` | TEXT | → users.id |
| `host_type` | TEXT | `citizen`, `founder_member`, `admin` |
| `submission_status` | TEXT | `draft`, `pending`, `approved`, `rejected`, `cancelled` |
| `max_capacity` | INTEGER | Limit (null = unlimited) |
| `current_rsvp_count` | INTEGER | Auto-updated |
| `cover_image_url` | TEXT | Event image |

#### Event Cultures (19)

Stored in `event_cultures` table:

| Column | Type | Description |
|--------|------|-------------|
| `slug` | TEXT | Primary key (culture ID) |
| `name` | TEXT | Display name |
| `emoji` | TEXT | Culture emoji |
| `color` | TEXT | Hex color code |
| `asset_file` | TEXT | Sticker file path |
| `description` | TEXT | Culture description |
| `tags` | TEXT[] | Searchable tags |
| `is_active` | BOOLEAN | Enabled for selection |
| `sort_order` | INTEGER | Display order |

**Culture Values:**

| Slug | Name |
|------|------|
| `science_technology` | Science & Technology |
| `business` | Business |
| `design` | Design |
| `food` | Food |
| `game` | Gaming |
| `health_fitness` | Health & Fitness |
| `home_lifestyle` | Home & Lifestyle |
| `law` | Law |
| `literature_stories` | Literature & Stories |
| `music_entertainment` | Music & Entertainment |
| `nature_wildlife` | Nature & Wildlife |
| `photography` | Photography |
| `spiritual` | Spiritual |
| `travel_adventure` | Travel & Adventure |
| `television_cinema` | Television & Cinema |
| `stories_journal` | Stories & Journal |
| `sport` | Sport |
| `follow_your_heart` | Follow Your Heart |
| `default` | Default |

---

### event_rsvps

RSVP records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | → canonical_events |
| `user_id` | TEXT | → users |
| `status` | TEXT | `interested`, `going`, `waitlist`, `cancelled` |
| `created_at` | TIMESTAMPTZ | RSVP time |

---

### vibe_checks

Telegram-based community governance for pending events. One row per pending event sent to the approval group.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | → canonical_events (CASCADE delete) |
| `tg_chat_id` | TEXT | Telegram group ID (from env) |
| `tg_message_id` | INTEGER | Telegram message ID (for editing vote counts) |
| `tg_message_type` | TEXT | `text` or `photo` (default: `text`) |
| `upvotes` | INTEGER | Current upvote count (default: 0) |
| `downvotes` | INTEGER | Current downvote count (default: 0) |
| `status` | TEXT | `open`, `approved`, `rejected` |
| `resolved_at` | TIMESTAMPTZ | When cron resolved the check |
| `created_at` | TIMESTAMPTZ | Creation time |
| `expires_at` | TIMESTAMPTZ | Voting deadline (created_at + 24h) |

**Index:** `idx_vibe_checks_status_expires` on `(status, expires_at)` — used by cron to find expired open checks.

---

### vibe_check_votes

Individual votes from Telegram group members. One vote per user per vibe check.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `vibe_check_id` | UUID | → vibe_checks (CASCADE delete) |
| `tg_user_id` | TEXT | Telegram user ID (string for large IDs) |
| `vote` | TEXT | `up` or `down` |
| `created_at` | TIMESTAMPTZ | Vote time |

**Constraint:** `UNIQUE(vibe_check_id, tg_user_id)` — one vote per TG user per check.

---

## Gamification Tables

### quests

Available quests/challenges.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `slug` | TEXT | URL-friendly ID |
| `title` | TEXT | Quest name |
| `description` | TEXT | Quest details |
| `reward` | INTEGER | Zo Points reward |
| `status` | TEXT | `active`, `inactive` |
| `category` | TEXT | Quest category |
| `cooldown_hours` | INTEGER | Repeat cooldown |
| `rewards_breakdown` | JSONB | Detailed rewards |

---

### completed_quests

Quest completion records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `wallet_address` | TEXT | User wallet |
| `quest_id` | TEXT | → quests |
| `completed_at` | TIMESTAMPTZ | Completion time |
| `transaction_hash` | TEXT | On-chain proof |
| `amount` | NUMERIC | Points earned |
| `metadata` | JSONB | Extra data |

---

### quest_scores

Individual quest attempts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `wallet_address` | TEXT | User wallet |
| `score` | INTEGER | Quest score |
| `location` | TEXT | Location name |
| `latitude`, `longitude` | FLOAT | Coordinates |
| `tokens_earned` | INTEGER | Points earned |
| `completed_at` | TIMESTAMPTZ | Completion time |

---

### user_quest_stats

Aggregate user quest statistics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `wallet_address` | TEXT | Unique wallet |
| `nickname` | TEXT | Display name |
| `avatar` | TEXT | Avatar URL |
| `total_tokens` | INTEGER | Total earned |
| `total_syncs` | INTEGER | Quest count |
| `best_score` | INTEGER | Highest score |
| `unique_locations` | INTEGER | Location count |
| `multiplier` | DECIMAL | Score multiplier |
| `last_sync_at` | TIMESTAMPTZ | Last quest |
| `next_sync_available_at` | TIMESTAMPTZ | Cooldown end |

---

### leaderboards

Aggregated rankings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `wallet` | TEXT | User wallet |
| `username` | TEXT | Display name |
| `zo_points` | INTEGER | Total points |
| `total_quests_completed` | INTEGER | Quest count |
| `last_quest_completed_at` | TIMESTAMPTZ | Last activity |

---

## Content Tables

### calendars

External calendar sources.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `name` | TEXT | Calendar name |
| `url` | TEXT | iCal/Luma URL |
| `type` | TEXT | `luma`, `ical`, `google`, `outlook` |
| `is_active` | BOOLEAN | Enabled |
| `description` | TEXT | Calendar details |

**Pre-seeded calendars**:
- Zo House Bangalore
- Zo House San Francisco
- ETHGlobal Events
- Singapore Token Events
- Mumbai Events
- Korea Blockchain Week
- Warsaw Blockchain Week
- Taipei Blockchain Week
