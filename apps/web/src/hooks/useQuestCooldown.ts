import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to check if a quest is available based on cooldown
 * Automatically refreshes every minute to update countdown
 */
export function useQuestCooldown(
  userId: string | undefined, 
  questSlug: string, 
  cooldownHours: number
) {
  const [canPlay, setCanPlay] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('Available now');
  const [isChecking, setIsChecking] = useState(true);
  const [nextAvailableAt, setNextAvailableAt] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh on window focus (when user returns from game)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused, forcing cooldown refresh');
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    // If no user, allow play (guest mode)
    if (!userId) {
      setCanPlay(true);
      setTimeRemaining('Available now');
      setIsChecking(false);
      return;
    }

    const checkCooldown = async () => {
      try {
        console.log('🔍 Checking cooldown for quest:', questSlug);
        
        // Get the last completion directly from completed_quests
        const { data, error } = await supabase
          .from('completed_quests')
          .select('completed_at')
          .eq('user_id', userId)
          .eq('quest_id', questSlug)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('⚠️ Error checking quest cooldown:', error.message);
          setCanPlay(true);
          setTimeRemaining('Available now');
          setNextAvailableAt(null);
          setIsChecking(false);
          return;
        }

        if (!data) {
          // No previous completion found - user can play
          console.log('✅ No previous completion, quest available');
          setCanPlay(true);
          setTimeRemaining('Available now');
          setNextAvailableAt(null);
          setIsChecking(false);
          return;
        }

        // Calculate time since last completion
        const lastCompletedAt = new Date(data.completed_at);
        const now = new Date();
        const hoursSinceLastCompletion = (now.getTime() - lastCompletedAt.getTime()) / (1000 * 60 * 60);

        console.log('⏰ Last completed:', lastCompletedAt, 'Hours since:', hoursSinceLastCompletion);

        if (hoursSinceLastCompletion >= cooldownHours) {
          // Cooldown expired - user can play
          console.log('✅ Cooldown expired, quest available');
          setCanPlay(true);
          setTimeRemaining('Available now');
          setNextAvailableAt(null);
        } else {
          // Still on cooldown
          const nextAvailable = new Date(lastCompletedAt.getTime() + cooldownHours * 60 * 60 * 1000);
          console.log('⏳ On cooldown, next available:', nextAvailable);
          setCanPlay(false);
          setNextAvailableAt(nextAvailable);
          
          const diffMs = nextAvailable.getTime() - now.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h : ${minutes}m`);
        }
        
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking quest cooldown:', error);
        // On error, allow play (fail open)
        setCanPlay(true);
        setTimeRemaining('Available now');
        setIsChecking(false);
      }
    };

    // Initial check
    checkCooldown();
    
    // Refresh every 10 seconds for faster updates
    const interval = setInterval(checkCooldown, 10000);
    
    return () => clearInterval(interval);
  }, [userId, questSlug, cooldownHours, refreshTrigger]);

  return { 
    canPlay, 
    timeRemaining, 
    isChecking,
    nextAvailableAt
  };
}

