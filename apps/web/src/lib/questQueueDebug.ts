/**
 * Quest Queue Debug Utility
 * 
 * Helper functions to inspect and manipulate the quest queue for debugging.
 * Can be exposed to window object for console access.
 */

import { devLog } from '@/lib/logger';

/**
 * Clear all queued quests (useful for testing)
 * Usage in console: clearQuestQueue()
 */
export function clearQuestQueue() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('zo_quest_queue');
    devLog.log('🗑️ Quest queue cleared');
  }
}

/**
 * View all queued quests
 * Usage in console: viewQuestQueue()
 */
export function viewQuestQueue() {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem('zo_quest_queue');
  const queue = stored ? JSON.parse(stored) : [];

  devLog.log('📦 Quest Queue:', queue);
  devLog.log(`Total items: ${queue.length}`);

  return queue;
}

/**
 * View all cooldowns
 * Usage in console: viewCooldowns()
 */
export function viewCooldowns() {
  if (typeof window === 'undefined') return {};

  const cooldowns: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('quest_cooldown_')) {
      cooldowns[key] = localStorage.getItem(key) || '';
    }
  }

  devLog.log('🔒 Active Cooldowns:', cooldowns);
  return cooldowns;
}

/**
 * Clear all cooldowns (for testing)
 * Usage in console: clearAllCooldowns()
 */
export function clearAllCooldowns() {
  if (typeof window === 'undefined') return;

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('quest_cooldown_')) {
      keys.push(key);
    }
  }

  keys.forEach(key => localStorage.removeItem(key));
  devLog.log(`🗑️ Cleared ${keys.length} cooldowns`);
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearQuestQueue = clearQuestQueue;
  (window as any).viewQuestQueue = viewQuestQueue;
  (window as any).viewCooldowns = viewCooldowns;
  (window as any).clearAllCooldowns = clearAllCooldowns;
}

