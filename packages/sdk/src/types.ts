/**
 * Shared TypeScript types for ZOHM WebApp and Mobile
 * 
 * These types ensure consistency across all clients consuming the API.
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;                    // Privy DID (v1) or ZO PID (v2)
  nickname: string;
  pfp: string | null;
  home_city: string | null;
  zo_points: number;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  user_id: string;
  zo_points: number;
  quests_completed: number;
  level: number;
  home_city: string | null;
  created_at: string;
}

export interface UserStreak {
  streak_type: 'login' | 'quest' | 'event' | 'checkin';
  current_streak: number;
  longest_streak: number;
  last_activity_at: string;
}

export interface UserReputation {
  reputation_type: 'builder' | 'connector' | 'explorer' | 'pioneer';
  score: number;
  level: number;
  updated_at: string;
}

export interface InventoryItem {
  item_type: 'badge' | 'nft' | 'consumable';
  item_id: string;
  quantity: number;
  metadata: Record<string, any>;
  acquired_at: string;
}

// ============================================================================
// Quest Types
// ============================================================================

export interface Quest {
  id: string;
  slug: string;
  title: string;
  description: string;
  quest_type: 'mini_game' | 'location' | 'social' | 'progressive';
  reward: number;
  rewards_breakdown: RewardsBreakdown;
  cooldown_hours: number;
  is_repeatable: boolean;
  verification_type: 'auto' | 'manual' | 'gps' | 'contract';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  is_active: boolean;
  created_at: string;
}

export interface RewardsBreakdown {
  zo_tokens: number | null;
  reputation?: Record<string, number>;
  items?: Array<{
    item_type: string;
    item_id: string;
    quantity: number;
  }>;
  streak_bonus?: {
    enabled: boolean;
    multiplier: number;
  };
}

export interface QuestCompletion {
  user_id: string;
  quest_id: string;
  score?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

export interface QuestCompletionResponse {
  success: boolean;
  completion_id: string;
  rewards: {
    zo_tokens: number;
    reputation: Record<string, number>;
    items: any[];
  };
  next_available_at: string | null;
}

// ============================================================================
// Leaderboard Types
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  nickname: string;
  zo_points: number;
  pfp: string | null;
  home_city: string | null;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total_users: number;
}

// ============================================================================
// City Types
// ============================================================================

export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  total_zo_earned: number;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// ============================================================================
// Avatar Types
// ============================================================================

export interface AvatarGenerateRequest {
  user_id: string;
  body_type: 'bro' | 'bae';
}

export interface AvatarStatusResponse {
  status: 'generating' | 'ready' | 'error';
  avatar_url: string | null;
  metadata?: {
    ref_id: number;
    body_type: string;
  };
  message?: string;
  error?: string;
}

// ============================================================================
// Vibe Score Types (v2.0)
// ============================================================================

export interface VibeFeatures {
  user_id: string;
  behavior_recent: number;      // 0..1
  session_presence: number;     // 0..1
  node_context: number;         // 0..1
  flow_indicator: number;       // 0..1
  social_sync: number;          // 0..1
  creative_output: number;      // 0..1
  decay: number;                // minutes since last activity
}

export interface VibeScoreBreakdown {
  behavior: number;
  presence: number;
  node: number;
  flow: number;
  social: number;
  creative: number;
  decay: number;
}

export interface VibeScore {
  score: number;                // 0-100
  breakdown: VibeScoreBreakdown;
  timestamp: string;
  user_id: string;
}

// ============================================================================
// NFT Types
// ============================================================================

export interface NFTCheckRequest {
  walletAddress: string;
  chainId: number;
  contractAddresses: string[];
}

export interface NFTCheckResponse {
  hasNFT: boolean;
  ownedContracts: string[];
  metadata: {
    token_ids: string[];
    total_owned: number;
  };
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description?: string;
  calendar_source: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, any>;
  code?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(response: ApiResponse<any>): response is ApiError {
  return response.success === false;
}

export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}
