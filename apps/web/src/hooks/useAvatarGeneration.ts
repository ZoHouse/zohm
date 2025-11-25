import { useState, useCallback, useRef, useEffect } from 'react';

type BodyType = 'bro' | 'bae';
type Gender = 'male' | 'female';

interface GenerateAvatarParams {
  userId: string;
  gender: Gender;
}

interface AvatarStatus {
  status: 'pending' | 'ready' | 'error';
  avatarUrl?: string;
  profile?: any;
  message?: string;
}

export const useAvatarGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  
  const MAX_POLLING_ATTEMPTS = 10;
  const POLLING_INTERVAL = 1000; // 1 second

  // Map gender to body_type
  const mapGenderToBodyType = (gender: Gender): BodyType => {
    return gender === 'male' ? 'bro' : 'bae';
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    attemptCountRef.current = 0;
    setAttemptCount(0);
  }, []);

  // Poll for avatar status
  const pollAvatarStatus = useCallback(async (userId: string): Promise<void> => {
    if (attemptCountRef.current >= MAX_POLLING_ATTEMPTS) {
      setIsGenerating(false);
      setError('Avatar generation timeout. Please try again or continue without avatar.');
      cleanup();
      return;
    }

    attemptCountRef.current += 1;
    setAttemptCount(attemptCountRef.current);

    try {
      // Get credentials from localStorage (for new users, these are stored after login)
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('zo_access_token') : null;
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('zo_device_id') : null;
      const deviceSecret = typeof window !== 'undefined' ? localStorage.getItem('zo_device_secret') : null;

      // Build query params with credentials from localStorage (for new users)
      const params = new URLSearchParams({ userId });
      if (accessToken) params.set('accessToken', accessToken);
      if (deviceId) params.set('deviceId', deviceId);
      if (deviceSecret) params.set('deviceSecret', deviceSecret);

      const response = await fetch(`/api/avatar/status?${params.toString()}`);
      const data: AvatarStatus = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check avatar status');
      }

      if (data.status === 'ready' && data.avatarUrl) {
        // Avatar is ready!
        setAvatarUrl(data.avatarUrl);
        setIsGenerating(false);
        setError(null);
        cleanup();
        return;
      }

      if (data.status === 'error') {
        throw new Error(data.message || 'Avatar generation failed');
      }

      // Avatar still pending, poll again
      pollingTimeoutRef.current = setTimeout(() => {
        pollAvatarStatus(userId);
      }, POLLING_INTERVAL);

    } catch (err) {
      console.error('Polling error:', err);
      
      // Retry on network errors (don't give up immediately)
      if (attemptCountRef.current < MAX_POLLING_ATTEMPTS) {
        pollingTimeoutRef.current = setTimeout(() => {
          pollAvatarStatus(userId);
        }, POLLING_INTERVAL);
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsGenerating(false);
        cleanup();
      }
    }
  }, [cleanup]);

  // Generate avatar
  const generateAvatar = useCallback(async ({ userId, gender }: GenerateAvatarParams) => {
    setIsGenerating(true);
    setAvatarUrl(null);
    setError(null);
    cleanup();

    try {
      const bodyType = mapGenderToBodyType(gender);

      // Get credentials from localStorage (for new users, these are stored after login)
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('zo_access_token') : null;
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('zo_device_id') : null;
      const deviceSecret = typeof window !== 'undefined' ? localStorage.getItem('zo_device_secret') : null;

      // Call generation API with credentials from localStorage (for new users)
      const response = await fetch('/api/avatar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          bodyType,
          // Pass credentials from localStorage for new users
          ...(accessToken && { accessToken }),
          ...(deviceId && { deviceId }),
          ...(deviceSecret && { deviceSecret }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate avatar');
      }

      // Check if avatar is immediately available (unlikely but possible)
      if (data.profile?.avatar?.image && 
          data.profile.avatar.image.trim() !== '' && 
          data.profile.avatar.image !== 'null') {
        setAvatarUrl(data.profile.avatar.image);
        setIsGenerating(false);
        return;
      }

      // Start polling for avatar status
      pollAvatarStatus(userId);

    } catch (err) {
      console.error('Generate avatar error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatar');
      setIsGenerating(false);
      cleanup();
    }
  }, [pollAvatarStatus, cleanup]);

  // Reset function
  const reset = useCallback(() => {
    cleanup();
    setIsGenerating(false);
    setAvatarUrl(null);
    setError(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    generateAvatar,
    isGenerating,
    avatarUrl,
    error,
    attemptCount,
    maxAttempts: MAX_POLLING_ATTEMPTS,
    reset,
    cleanup,
  };
};

