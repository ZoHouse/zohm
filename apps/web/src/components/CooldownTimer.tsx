'use client';

import { useState, useEffect } from 'react';

interface CooldownTimerProps {
  targetDate: string;
  className?: string;
}

/**
 * Real-time countdown timer that updates every minute
 * Shows time remaining until a quest becomes available
 */
export default function CooldownTimer({ targetDate, className = '' }: CooldownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining('Available now');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Show hours and minutes if more than 1 hour
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } 
      // Show minutes and seconds if less than 1 hour
      else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } 
      // Show just seconds if less than 1 minute
      else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Calculate immediately
    calculateTimeRemaining();
    
    // Update every second for smooth countdown
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className={`font-mono font-semibold text-zo-accent ${className}`}>
      {timeRemaining}
    </span>
  );
}





