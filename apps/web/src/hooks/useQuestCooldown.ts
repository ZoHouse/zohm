/**
 * P0-6 Enhancement: Client-Side Cooldown UI State Management
 * 
 * This hook manages the UI state for quest cooldowns. It works in conjunction
 * with the server-side atomic validation (complete_quest_atomic function).
 * 
 * Purpose:
 * - Show cooldown status in UI before user attempts to play
 * - Display countdown timer for better UX
 * - Store cooldown state in localStorage for persistence across page reloads
 * 
 * Note: This is CLIENT-SIDE ONLY for UX. The actual security validation
 * happens server-side in the atomic database function.
 */

import { useState, useEffect } from 'react';

const COOLDOWN_KEY_PREFIX = 'quest_cooldown_';

export interface QuestCooldownState {
  canPlay: boolean;
  timeRemaining: string;
  isChecking: boolean;
  nextAvailableAt: string | null;
}

export function useQuestCooldown(questId: string, userId?: string): QuestCooldownState {
  const [cooldownState, setCooldownState] = useState<QuestCooldownState>({
    canPlay: true,
    timeRemaining: '',
    isChecking: true,
    nextAvailableAt: null,
  });

  // Check cooldown on mount and set up interval
  useEffect(() => {
    if (!userId || !questId) {
      setCooldownState({
        canPlay: true,
        timeRemaining: '',
        isChecking: false,
        nextAvailableAt: null,
      });
      return;
    }

    // 1. Initial check from server (Source of Truth)
    const syncWithServer = async () => {
      try {
        const res = await fetch(`/api/quests/status?userId=${userId}&questId=${questId}`);
        const data = await res.json();
        
        if (data.nextAvailableAt) {
          // Server says cooldown active - update storage
          const serverNextAvailable = new Date(data.nextAvailableAt).toISOString();
          setQuestCooldown(questId, userId, serverNextAvailable);
        } else if (data.canComplete) {
          // Server says ready - clear local storage just in case
          clearQuestCooldown(questId, userId);
        }
      } catch (err) {
        console.error('Failed to sync cooldown with server:', err);
        // Fallback to localStorage if server check fails
      }
    };

    // Run server sync once on mount
    syncWithServer();

    // 2. Continuous local check (for UI updates)
    const checkCooldown = () => {
      const storageKey = `${COOLDOWN_KEY_PREFIX}${userId}_${questId}`;
      const storedCooldown = localStorage.getItem(storageKey);

      if (!storedCooldown) {
        // No cooldown stored
        setCooldownState({
          canPlay: true,
          timeRemaining: '',
          isChecking: false,
          nextAvailableAt: null,
        });
        return;
      }

      try {
        const nextAvailableAt = new Date(storedCooldown);
        const now = new Date();

        if (now >= nextAvailableAt) {
          // Cooldown expired
          localStorage.removeItem(storageKey);
          setCooldownState({
            canPlay: true,
            timeRemaining: '',
            isChecking: false,
            nextAvailableAt: null,
          });
        } else {
          // Cooldown still active
          const remainingMs = nextAvailableAt.getTime() - now.getTime();
          const timeString = formatTimeRemaining(remainingMs);

          setCooldownState({
            canPlay: false,
            timeRemaining: timeString,
            isChecking: false,
            nextAvailableAt: storedCooldown,
          });
        }
      } catch (error) {
        console.error('Error parsing cooldown timestamp:', error);
        localStorage.removeItem(storageKey);
        setCooldownState({
          canPlay: true,
          timeRemaining: '',
          isChecking: false,
          nextAvailableAt: null,
        });
      }
    };

    // Check immediately
    checkCooldown();
    
    // Update every second for countdown
    const interval = setInterval(checkCooldown, 1000);
    
    return () => clearInterval(interval);
  }, [questId, userId]);

  return cooldownState;
}

/**
 * Set cooldown end time in localStorage
 * Call this when receiving a 429 response from the API
 */
export function setQuestCooldown(questId: string, userId: string, nextAvailableAt: string) {
  const storageKey = `${COOLDOWN_KEY_PREFIX}${userId}_${questId}`;
  localStorage.setItem(storageKey, nextAvailableAt);
  console.log(`🔒 Cooldown set for ${questId} until:`, nextAvailableAt);
}

/**
 * Clear cooldown (useful for testing or when quest completes successfully)
 */
export function clearQuestCooldown(questId: string, userId: string) {
  const storageKey = `${COOLDOWN_KEY_PREFIX}${userId}_${questId}`;
  localStorage.removeItem(storageKey);
  console.log(`✅ Cooldown cleared for ${questId}`);
}

/**
 * Format milliseconds into human-readable time string
 * Examples:
 * - 11h 59m 30s
 * - 59m 30s
 * - 30s
 */
function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}
