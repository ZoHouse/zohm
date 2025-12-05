/**
 * Quest Completion Queue - Offline-first retry mechanism
 * 
 * This module provides a robust queue system for quest completions that:
 * - Saves failed requests to localStorage
 * - Automatically retries with exponential backoff
 * - Ensures no user progress is lost due to network issues
 * 
 * P0-2: Network Retry Mechanism
 */

import { devLog } from '@/lib/logger';

const QUEUE_KEY = 'zo_quest_queue';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface QuestCompletionData {
  user_id: string;
  quest_id: string;
  score: number;
  location: string;
  metadata: {
    quest_title: string;
    completed_via: string;
    game_won: boolean;
    reward_zo: number;
    distance_from_target: number;
    proximity_factor: number;
    timestamp: string;
  };
}

interface QueuedRequest {
  id: string;
  data: QuestCompletionData;
  timestamp: number;
  retries: number;
  nextRetry: number;
}

/**
 * Get all queued requests from localStorage
 */
function getQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    devLog.error('❌ Error reading quest queue:', error);
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedRequest[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    devLog.error('❌ Error saving quest queue:', error);
  }
}

/**
 * Add a quest completion to the queue
 */
export function addToQueue(data: QuestCompletionData): string {
  const id = `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const queue = getQueue();

  const request: QueuedRequest = {
    id,
    data,
    timestamp: Date.now(),
    retries: 0,
    nextRetry: Date.now(), // Retry immediately
  };

  queue.push(request);
  saveQueue(queue);

  devLog.log(`📦 Added quest to offline queue: ${id}`, data);
  return id;
}

/**
 * Remove a completed request from the queue
 */
function removeFromQueue(id: string): void {
  const queue = getQueue();
  const filtered = queue.filter(req => req.id !== id);
  saveQueue(filtered);
  devLog.log(`✅ Removed from queue: ${id}`);
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(retries: number): number {
  return INITIAL_RETRY_DELAY * Math.pow(2, retries);
}

/**
 * Attempt to submit a single quest completion
 */
async function submitQuestCompletion(data: QuestCompletionData): Promise<boolean> {
  try {
    const response = await fetch('/api/quests/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      devLog.log('✅ Quest completion submitted:', result);
      return true;
    } else if (response.status === 429) {
      // Cooldown - this is expected, not a failure
      const error = await response.json();
      devLog.warn('⏳ Quest on cooldown (will retry):', error.next_available_at);
      return false; // Retry later
    } else {
      devLog.error('❌ Error submitting quest:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    devLog.error('❌ Network error submitting quest:', error);
    return false;
  }
}

/**
 * Process all queued requests
 * Called on app start and after adding new items
 */
export async function processQueue(): Promise<void> {
  const queue = getQueue();
  const now = Date.now();

  if (queue.length === 0) {
    return;
  }

  devLog.log(`🔄 Processing quest queue (${queue.length} items)...`);

  for (const request of queue) {
    // Check if it's time to retry this request
    if (request.nextRetry > now) {
      devLog.log(`⏳ Skipping ${request.id} (next retry in ${Math.round((request.nextRetry - now) / 1000)}s)`);
      continue;
    }

    // Check if we've exceeded max retries
    if (request.retries >= MAX_RETRIES) {
      devLog.error(`❌ Max retries exceeded for ${request.id}, removing from queue`);
      removeFromQueue(request.id);
      continue;
    }

    devLog.log(`🔄 Retrying quest completion: ${request.id} (attempt ${request.retries + 1}/${MAX_RETRIES})`);

    const success = await submitQuestCompletion(request.data);

    if (success) {
      // Success! Remove from queue
      removeFromQueue(request.id);
    } else {
      // Failed, update retry count and schedule next retry
      request.retries += 1;
      request.nextRetry = now + getBackoffDelay(request.retries);

      // Update the queue
      const updatedQueue = getQueue().map(req =>
        req.id === request.id ? request : req
      );
      saveQueue(updatedQueue);

      devLog.log(`⏰ Scheduled retry for ${request.id} in ${Math.round(getBackoffDelay(request.retries) / 1000)}s`);
    }
  }

  devLog.log(`✅ Queue processing complete. ${getQueue().length} items remaining.`);
}

/**
 * Get queue statistics (for debugging/monitoring)
 */
export function getQueueStats() {
  const queue = getQueue();
  return {
    total: queue.length,
    pending: queue.filter(r => r.retries === 0).length,
    retrying: queue.filter(r => r.retries > 0).length,
    oldest: queue.length > 0 ? new Date(Math.min(...queue.map(r => r.timestamp))) : null,
  };
}

/**
 * Clear the entire queue (use with caution!)
 */
export function clearQueue(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(QUEUE_KEY);
    devLog.log('🗑️ Quest queue cleared');
  }
}

/**
 * Initialize queue processing on app start
 * Call this in your main component's useEffect
 */
export function initQueueProcessing(): void {
  // Process queue immediately
  processQueue();

  // Set up periodic processing (every 30 seconds)
  const interval = setInterval(() => {
    processQueue();
  }, 30000);

  // Return cleanup function
  if (typeof window !== 'undefined') {
    (window as any).__questQueueInterval = interval;
  }
}

/**
 * Stop queue processing
 */
export function stopQueueProcessing(): void {
  if (typeof window !== 'undefined' && (window as any).__questQueueInterval) {
    clearInterval((window as any).__questQueueInterval);
    delete (window as any).__questQueueInterval;
  }
}

