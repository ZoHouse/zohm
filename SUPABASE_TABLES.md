# Supabase Tables Documentation

Complete reference of all tables in your Supabase database with their columns and usage.

---

## 1. `users` Table
**Purpose**: Main user profiles using Privy authentication (new system)

**Columns**:
- `id` (string, PRIMARY KEY) - Privy DID (e.g., `did:privy:...`)
- `name` (string | null) - User's display name
- `bio` (string | null) - User biography
- `pfp` (string | null) - Profile picture URL
- `culture` (string | null) - User's culture/community
- `email` (string | null) - Email address
- `x_handle` (string | null) - Twitter/X handle
- `x_connected` (boolean) - Whether X/Twitter is connected
- `lat` (number | null) - Latitude for location
- `lng` (number | null) - Longitude for location
- `role` ('Founder' | 'Member' | 'Citizen') - User role
- `founder_nfts_count` (number) - Number of Founder NFTs owned
- `calendar_url` (string | null) - Personal calendar URL
- `main_quest_url` (string | null) - Main quest URL
- `side_quest_url` (string | null) - Side quest URL
- `onboarding_completed` (boolean) - Whether onboarding is complete
- `onboarding_step` (number) - Current onboarding step
- `created_at` (string) - Account creation timestamp
- `last_seen` (string | null) - Last seen timestamp
- `updated_at` (string) - Last update timestamp

**Usage**: Primary user table for Privy-authenticated users. Replaces the old `members` table.

---

## 2. `user_wallets` Table
**Purpose**: Stores wallet addresses linked to users

**Columns**:
- `id` (string, PRIMARY KEY)
- `user_id` (string, FOREIGN KEY → `users.id`) - Links to users table
- `address` (string) - Wallet address
- `chain_type` ('ethereum' | 'avalanche' | 'solana' | 'polygon' | 'base') - Blockchain network
- `wallet_client` (string | null) - Wallet client type
- `wallet_client_type` (string | null) - Wallet client type identifier
- `is_embedded` (boolean) - Whether wallet is embedded (Privy wallet)
- `is_primary` (boolean) - Whether this is the user's primary wallet
- `is_verified` (boolean) - Whether wallet is verified
- `verified_at` (string | null) - Verification timestamp
- `linked_at` (string) - When wallet was linked
- `last_used_at` (string | null) - Last usage timestamp

**Usage**: Manages multiple wallets per user. One wallet per user should have `is_primary: true`.

---

## 3. `user_auth_methods` Table
**Purpose**: Stores authentication methods linked to users

**Columns**:
- `id` (string, PRIMARY KEY)
- `user_id` (string, FOREIGN KEY → `users.id`) - Links to users table
- `auth_type` ('email' | 'google' | 'twitter' | 'discord' | 'farcaster' | 'wallet') - Authentication method
- `identifier` (string) - Unique identifier (email address, wallet address, etc.)
- `display_name` (string | null) - Display name for the auth method
- `oauth_subject` (string | null) - OAuth subject ID
- `oauth_username` (string | null) - OAuth username
- `is_verified` (boolean) - Whether auth method is verified
- `verified_at` (string | null) - Verification timestamp
- `linked_at` (string) - When auth method was linked
- `last_used_at` (string | null) - Last usage timestamp

**Usage**: Tracks all authentication methods (email, social logins, wallets) for each user.

---

## 4. `members` Table
**Purpose**: Legacy user table (now a VIEW or backward compatibility table)

**Columns**:
- `id` (string, PRIMARY KEY)
- `wallet` (string) - Wallet address (unique)
- `pfp` (string | null) - Profile picture URL
- `name` (string | null) - User's display name
- `founder_nfts_count` (number) - Number of Founder NFTs owned
- `bio` (string | null) - User biography
- `x_handle` (string | null) - Twitter/X handle
- `x_connected` (boolean) - Whether X/Twitter is connected
- `culture` (string | null) - User's culture/community
- `role` (string) - User role
- `email` (string | null) - Email address
- `lat` (number | null) - Latitude
- `lng` (number | null) - Longitude
- `latitude` (number | null) - Legacy latitude field
- `longitude` (number | null) - Legacy longitude field
- `calendar_url` (string | null) - Personal calendar URL
- `created_at` (string) - Account creation timestamp
- `last_seen` (string | null) - Last seen timestamp

**Usage**: Backward compatibility table. May be a VIEW that references `users` table. Used for wallet-based lookups.

---

## 5. `nodes` Table
**Purpose**: Stores partner nodes/locations (hacker spaces, culture houses, etc.)

**Columns**:
- `id` (string, PRIMARY KEY)
- `name` (string, NOT NULL) - Node name
- `type` (string, NOT NULL) - Node type: 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone'
- `description` (string, NOT NULL) - Node description
- `city` (string, NOT NULL) - City location
- `country` (string, NOT NULL) - Country location
- `latitude` (number | null) - Latitude coordinate
- `longitude` (number | null) - Longitude coordinate
- `website` (string | null) - Website URL
- `twitter` (string | null) - Twitter/X handle
- `features` (string[], NOT NULL, DEFAULT '{}') - Array of features
- `status` (string, NOT NULL) - Status: 'active' | 'developing' | 'planning'
- `image` (string | null) - Image URL
- `contact_email` (string | null) - Contact email
- `inserted_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

**Usage**: Stores physical locations and partner spaces that appear on the map.

**Indexes**:
- `idx_nodes_type` on `type`
- `idx_nodes_city_country` on `city, country`

---

## 6. `calendars` Table
**Purpose**: Stores calendar sources for events

**Columns**:
- `id` (string, PRIMARY KEY, DEFAULT gen_random_uuid()) - Unique calendar ID
- `name` (string, NOT NULL) - Calendar name
- `url` (string, NOT NULL, UNIQUE) - Calendar URL (iCal, Luma, etc.)
- `type` (string, NOT NULL) - Calendar type: 'luma' | 'ical' | 'google' | 'outlook'
- `is_active` (boolean, NOT NULL, DEFAULT true) - Whether calendar is active
- `description` (string | null) - Calendar description
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

**Usage**: Manages event calendar sources. Events are parsed from these calendar URLs.

**Indexes**:
- `idx_calendars_active` on `is_active`
- `idx_calendars_type` on `type`

**Default Calendars**:
- Zo House Bangalore
- Zo House San Francisco
- ETHGlobal Events
- Singapore Token Events
- ETH Delhi Side Events
- Mumbai Events
- Cursor Community
- Singapore Events
- Taipei Blockchain Week
- Warsaw Blockchain Week
- Korea Blockchain Week

---

## 7. `leaderboards` Table
**Purpose**: Stores leaderboard entries for users

**Columns**:
- `id` (string, PRIMARY KEY)
- `wallet` (string) - Wallet address
- `username` (string) - Username
- `zo_points` (number) - Points earned

**Usage**: Tracks user rankings and points for gamification.

---

## 8. `quests` Table
**Purpose**: Stores available quests/challenges

**Columns**:
- `id` (string, PRIMARY KEY)
- `title` (string) - Quest title
- `description` (string) - Quest description
- `reward` (number) - Reward amount/points
- `status` (string) - Quest status

**Usage**: Defines quests that users can complete.

---

## 9. `completed_quests` Table
**Purpose**: Tracks which quests users have completed

**Columns**:
- `id` (string, PRIMARY KEY, DEFAULT gen_random_uuid()) - Unique completion ID
- `wallet_address` (string) - User's wallet address (lowercase)
- `quest_id` (string, NOT NULL) - Quest ID from `quests` table
- `completed_at` (timestamp, DEFAULT now()) - Completion timestamp
- `transaction_hash` (string | null) - Blockchain transaction hash
- `amount` (numeric(20, 18) | null) - Reward amount
- `metadata` (jsonb | null) - Additional metadata
- `created_at` (timestamp, DEFAULT now()) - Record creation timestamp

**Usage**: Prevents duplicate quest completions and tracks completion history.

**Indexes**:
- `idx_completed_quests_wallet` on `wallet_address`
- `idx_completed_quests_quest` on `quest_id`
- `idx_completed_quests_completed_at` on `completed_at`

**Constraints**:
- `unique_wallet_quest` - Unique constraint on `(wallet_address, quest_id)` to prevent duplicates

---

## Storage Buckets

### `Profile Photos` Bucket
**Purpose**: Stores user profile photos

**Note**: This is a Supabase Storage bucket, not a database table. Files are stored with the naming pattern: `{wallet_address}.{extension}`

---

## Table Relationships

```
users (1) ──→ (many) user_wallets
users (1) ──→ (many) user_auth_methods
members ──→ (may be VIEW referencing users)
completed_quests ──→ (references quests via quest_id)
```

---

## Notes

- The `members` table may be a VIEW that queries the `users` table for backward compatibility
- Events are parsed from calendar URLs and are not stored in a database table (they're rendered from iCal data)
- The `Profile Photos` bucket uses Supabase Storage, not a database table
- All timestamp fields use `timestamp with time zone` in PostgreSQL
- The `users` table is the primary user management system after migrating from wallet-based to Privy authentication

