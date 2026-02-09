/**
 * Telegram Bot API Client
 *
 * Raw fetch wrapper for the Telegram Bot API.
 * No external dependencies — mirrors the lib/luma/client.ts pattern.
 * All messages use HTML parse mode.
 */

import { devLog } from '@/lib/logger';
import type {
  TelegramResponse,
  TelegramMessage,
  InlineKeyboardMarkup,
} from './types';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function getApiUrl(method: string): string {
  if (!BOT_TOKEN) {
    throw new Error('[Telegram] TELEGRAM_BOT_TOKEN is not set');
  }
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
}

async function tgFetch<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const url = getApiUrl(method);

  devLog.log(`[Telegram] ${method}`, JSON.stringify(body).slice(0, 200));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as TelegramResponse<T>;

  if (!json.ok) {
    devLog.error(`[Telegram] ${method} failed:`, json.description);
    return null;
  }

  return json.result ?? null;
}

/**
 * Send a text message with optional inline keyboard
 */
export async function sendMessage(
  chatId: string,
  text: string,
  keyboard?: InlineKeyboardMarkup
): Promise<TelegramMessage | null> {
  return tgFetch<TelegramMessage>('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...(keyboard && { reply_markup: keyboard }),
  });
}

/**
 * Send a photo with caption and optional inline keyboard
 */
export async function sendPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
  keyboard?: InlineKeyboardMarkup
): Promise<TelegramMessage | null> {
  return tgFetch<TelegramMessage>('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
    ...(keyboard && { reply_markup: keyboard }),
  });
}

/**
 * Edit the caption of a photo message
 */
export async function editMessageCaption(
  chatId: string,
  messageId: number,
  caption: string,
  keyboard?: InlineKeyboardMarkup
): Promise<TelegramMessage | null> {
  return tgFetch<TelegramMessage>('editMessageCaption', {
    chat_id: chatId,
    message_id: messageId,
    caption,
    parse_mode: 'HTML',
    ...(keyboard && { reply_markup: keyboard }),
  });
}

/**
 * Edit the text of a text message
 */
export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboardMarkup
): Promise<TelegramMessage | null> {
  return tgFetch<TelegramMessage>('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    ...(keyboard && { reply_markup: keyboard }),
  });
}

/**
 * Acknowledge a callback query (button press)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  const result = await tgFetch<boolean>('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text && { text }),
  });
  return result ?? false;
}
