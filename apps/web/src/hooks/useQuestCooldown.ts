import { useEffect, useState } from 'react';
import { getTimeUntilNextQuest } from '@/lib/questService';

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
        const time = await getTimeUntilNextQuest(userId, questSlug, cooldownHours);
        setTimeRemaining(time);
        
        const available = time === 'Available now';
        setCanPlay(available);
        
        // Calculate next available timestamp
        if (!available && time.includes('h')) {
          const [hours, minutes] = time.split(':').map(part => parseInt(part.replace(/\D/g, '')));
          const next = new Date();
          next.setHours(next.getHours() + (hours || 0));
          next.setMinutes(next.getMinutes() + (minutes || 0));
          setNextAvailableAt(next);
        } else {
          setNextAvailableAt(null);
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
    
    // Refresh every minute to update countdown
    const interval = setInterval(checkCooldown, 60000);
    
    return () => clearInterval(interval);
  }, [userId, questSlug, cooldownHours]);

  return { 
    canPlay, 
    timeRemaining, 
    isChecking,
    nextAvailableAt
  };
}

