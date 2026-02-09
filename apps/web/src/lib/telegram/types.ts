/**
 * Telegram Bot API Types + Vibe Check Domain Types
 *
 * Minimal type definitions for the subset of the Telegram Bot API
 * used by the vibe check system (inline keyboards, callback queries).
 */

// ============================================
// TELEGRAM BOT API TYPES
// ============================================

export interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    type: string;
    title?: string;
  };
  from?: TelegramUser;
  text?: string;
  caption?: string;
  date: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

// ============================================
// VIBE CHECK DOMAIN TYPES
// ============================================

export type VibeCheckStatus = 'open' | 'approved' | 'rejected';

export interface VibeCheck {
  id: string;
  event_id: string;
  tg_chat_id: string;
  tg_message_id: number | null;
  tg_message_type: 'text' | 'photo';
  upvotes: number;
  downvotes: number;
  status: VibeCheckStatus;
  resolved_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface VibeCheckVote {
  id: string;
  vibe_check_id: string;
  tg_user_id: string;
  vote: 'up' | 'down';
  created_at: string;
}
