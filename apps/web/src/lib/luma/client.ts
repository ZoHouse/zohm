/**
 * Luma API Client
 *
 * Rate-limited HTTP client for the Luma public API.
 * Uses a sliding-window rate limiter (280 req/min, 20-request buffer below Luma's 300 limit).
 * Handles 429 responses with automatic backoff using retry-after header.
 *
 * Auth: x-luma-api-key header per request (each calendar has its own key).
 *
 * @see https://docs.lu.ma/reference
 */

import { devLog } from '@/lib/logger';
import type {
  LumaEvent,
  LumaGuest,
  LumaWebhook,
  LumaCreateEventInput,
  LumaUpdateEventInput,
  LumaAddGuestInput,
  LumaPaginatedResponse,
  LumaEventResponse,
  LumaGuestStatus,
} from './types';

// ============================================
// RATE LIMITER
// ============================================

const RATE_LIMIT_MAX = 280;       // 20-request buffer below Luma's 300/min
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute sliding window
const MAX_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 2000;

class RateLimiter {
  private timestamps: number[] = [];

  /**
   * Wait until a request slot is available
   */
  async acquire(): Promise<void> {
    this.prune();

    if (this.timestamps.length >= RATE_LIMIT_MAX) {
      // Wait until the oldest request in the window expires
      const oldestTs = this.timestamps[0];
      const waitMs = oldestTs + RATE_LIMIT_WINDOW_MS - Date.now() + 50; // +50ms buffer
      if (waitMs > 0) {
        devLog.warn(`[Luma] Rate limit reached, waiting ${waitMs}ms`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        this.prune();
      }
    }

    this.timestamps.push(Date.now());
  }

  private prune(): void {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }
}

// ============================================
// CLIENT
// ============================================

const BASE_URL = 'https://public-api.luma.com';
const rateLimiter = new RateLimiter();

/**
 * Core fetch wrapper with rate limiting, retries, and 429 backoff
 */
async function lumaFetch<T>(
  apiKey: string,
  path: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  await rateLimiter.acquire();

  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'x-luma-api-key': apiKey,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  devLog.log(`[Luma] ${options.method || 'GET'} ${path}`);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Handle rate limiting
  if (res.status === 429) {
    if (retryCount >= MAX_RETRIES) {
      throw new LumaApiError('Rate limit exceeded after retries', 429, path);
    }

    const retryAfter = res.headers.get('retry-after');
    const backoffMs = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : DEFAULT_BACKOFF_MS * Math.pow(2, retryCount);

    devLog.warn(`[Luma] 429 rate limited, retrying in ${backoffMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    return lumaFetch<T>(apiKey, path, options, retryCount + 1);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new LumaApiError(
      `Luma API error: ${res.status} ${res.statusText} — ${body}`,
      res.status,
      path
    );
  }

  return res.json() as Promise<T>;
}

// ============================================
// ERROR CLASS
// ============================================

export class LumaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string
  ) {
    super(message);
    this.name = 'LumaApiError';
  }
}

// ============================================
// API METHODS
// ============================================

/**
 * List events from a Luma calendar
 */
export async function listEvents(
  apiKey: string,
  options: { after?: string; before?: string; limit?: number } = {}
): Promise<LumaPaginatedResponse<{ event: LumaEvent }>> {
  const params = new URLSearchParams();
  if (options.after) params.set('after', options.after);
  if (options.before) params.set('before', options.before);
  if (options.limit) params.set('pagination_limit', String(options.limit));

  const query = params.toString();
  return lumaFetch<LumaPaginatedResponse<{ event: LumaEvent }>>(
    apiKey,
    `/public/v1/calendar/list-events${query ? `?${query}` : ''}`
  );
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  apiKey: string,
  eventId: string
): Promise<LumaEventResponse> {
  return lumaFetch<LumaEventResponse>(
    apiKey,
    `/public/v1/event/get?event_api_id=${encodeURIComponent(eventId)}`
  );
}

/**
 * List guests (RSVPs) for an event
 */
export async function getGuests(
  apiKey: string,
  eventId: string,
  options: { status?: LumaGuestStatus; limit?: number; cursor?: string } = {}
): Promise<LumaPaginatedResponse<LumaGuest>> {
  const params = new URLSearchParams();
  params.set('event_api_id', eventId);
  if (options.status) params.set('status', options.status);
  if (options.limit) params.set('pagination_limit', String(options.limit));
  if (options.cursor) params.set('pagination_cursor', options.cursor);

  return lumaFetch<LumaPaginatedResponse<LumaGuest>>(
    apiKey,
    `/public/v1/event/get-guests?${params.toString()}`
  );
}

/**
 * Create a new event on Luma
 */
export async function createEvent(
  apiKey: string,
  data: LumaCreateEventInput
): Promise<LumaEventResponse> {
  return lumaFetch<LumaEventResponse>(
    apiKey,
    '/public/v1/event/create',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update an existing Luma event
 */
export async function updateEvent(
  apiKey: string,
  eventId: string,
  data: LumaUpdateEventInput
): Promise<LumaEventResponse> {
  return lumaFetch<LumaEventResponse>(
    apiKey,
    '/public/v1/event/update',
    {
      method: 'POST',
      body: JSON.stringify({ event_api_id: eventId, ...data }),
    }
  );
}

/**
 * Add guests to a Luma event
 */
export async function addGuests(
  apiKey: string,
  eventId: string,
  guests: LumaAddGuestInput[]
): Promise<void> {
  await lumaFetch<unknown>(
    apiKey,
    '/public/v1/event/add-guests',
    {
      method: 'POST',
      body: JSON.stringify({ event_api_id: eventId, guests }),
    }
  );
}

/**
 * Update a guest's status on Luma
 */
export async function updateGuestStatus(
  apiKey: string,
  eventId: string,
  guestEmail: string,
  status: 'approved' | 'declined'
): Promise<void> {
  await lumaFetch<unknown>(
    apiKey,
    '/public/v1/event/update-guest-status',
    {
      method: 'POST',
      body: JSON.stringify({
        event_api_id: eventId,
        email: guestEmail,
        approval_status: status,
      }),
    }
  );
}

/**
 * Create a webhook subscription
 */
export async function createWebhook(
  apiKey: string,
  url: string,
  eventTypes: string[]
): Promise<LumaWebhook> {
  return lumaFetch<LumaWebhook>(
    apiKey,
    '/public/v1/calendar/create-webhook',
    {
      method: 'POST',
      body: JSON.stringify({ url, event_types: eventTypes }),
    }
  );
}

/**
 * List active webhooks
 */
export async function listWebhooks(
  apiKey: string
): Promise<LumaPaginatedResponse<LumaWebhook>> {
  return lumaFetch<LumaPaginatedResponse<LumaWebhook>>(
    apiKey,
    '/public/v1/calendar/list-webhooks'
  );
}

// Export a namespace-like object for convenience
export const lumaClient = {
  listEvents,
  getEvent,
  getGuests,
  createEvent,
  updateEvent,
  addGuests,
  updateGuestStatus,
  createWebhook,
  listWebhooks,
};
