import { useState, useEffect, useRef } from 'react';
import { getProfile } from '@/lib/zo-api/profile';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

export interface FounderNFT {
  token_id: string;
  name: string;
  video: string; // Video URL from CDN
}

export function useFounderNFTs() {
  const [nfts, setNfts] = useState<FounderNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function fetchFounderNFTs() {
      try {
        setIsLoading(true);
        setError(null);

        // Get credentials from localStorage and Supabase
        if (typeof window === 'undefined') {
          setNfts([]);
          setIsLoading(false);
          return;
        }

        // Get user ID from localStorage
        const userId = localStorage.getItem('zo_user_id');
        if (!userId) {
          devLog.log('No user ID, skipping founder NFTs fetch');
          setNfts([]);
          setIsLoading(false);
          return;
        }

        // Fetch user data from Supabase (includes device credentials and access token)
        devLog.log('🔑 Fetching Founder NFTs with device credentials from localStorage');
        
        // Get credentials from localStorage (they're now saved there after login)
        const accessToken = localStorage.getItem('zo_access_token');
        const deviceId = localStorage.getItem('zo_device_id');
        const deviceSecret = localStorage.getItem('zo_device_secret');
          
        if (!accessToken) {
          devLog.log('No access token, skipping founder NFTs fetch');
          setNfts([]);
          setIsLoading(false);
          return;
        }

        if (!deviceId || !deviceSecret) {
          devLog.log('No device credentials in localStorage, skipping founder NFTs fetch');
          setNfts([]);
          setIsLoading(false);
          return;
        }

        devLog.log('🔑 Fetching Founder NFTs with device credentials from localStorage');
        devLog.log('📊 Credentials:', {
          hasAccessToken: !!accessToken,
          hasDeviceId: !!deviceId,
          hasDeviceSecret: !!deviceSecret,
          userId,
        });

        // Fetch profile from ZO API with device credentials
        const result = await getProfile(
          accessToken,
          userId,
          { deviceId, deviceSecret }
        );
        
        devLog.log('📡 ZO API Profile Result:', {
          success: result.success,
          hasProfile: !!result.profile,
          error: result.error,
          founderTokensCount: result.profile?.founder_tokens?.length || 0,
        });
        
        if (!result.success || !result.profile) {
          devLog.warn('⚠️ Profile fetch failed:', result.error);
          // Don't throw - just silently fail
          setNfts([]);
          setIsLoading(false);
          return;
        }

        const founderTokens = result.profile.founder_tokens || [];
        
        // founder_tokens is an array of strings like ["523", "204", "158", "151"]
        // Map to our NFT format with video URLs from CDN
        const nftsWithImages: FounderNFT[] = founderTokens.map((tokenId: string) => ({
          token_id: tokenId,
          name: `#${tokenId}`,
          video: `https://cdn.zo.xyz/nft/founders/${tokenId}.mp4`
        }));

        devLog.log('✅ Loaded', nftsWithImages.length, 'Founder NFTs');
        setNfts(nftsWithImages);
        hasFetchedRef.current = true;

      } catch (err) {
        devLog.warn('⚠️ Could not fetch Founder NFTs:', err);
        // Don't show error to user, just silently fail
        setError(null);
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    }

    // Fetch immediately on mount if credentials are available
    const hasCredentials = 
      localStorage.getItem('zo_user_id') &&
      localStorage.getItem('zo_access_token') &&
      localStorage.getItem('zo_device_id') &&
      localStorage.getItem('zo_device_secret');
    
    if (hasCredentials && !hasFetchedRef.current) {
      fetchFounderNFTs();
    } else if (!hasCredentials) {
      setIsLoading(false);
    }

    // Listen for login success event to re-fetch when user logs in
    const handleLoginSuccess = () => {
      devLog.log('📢 zoLoginSuccess event received, re-fetching Founder NFTs');
      hasFetchedRef.current = false; // Reset to allow re-fetch
      fetchFounderNFTs();
    };

    window.addEventListener('zoLoginSuccess', handleLoginSuccess);

    // Also check periodically if credentials become available (for cases where login happens before mount)
    const checkInterval = setInterval(() => {
      const hasCreds = 
        localStorage.getItem('zo_user_id') &&
        localStorage.getItem('zo_access_token') &&
        localStorage.getItem('zo_device_id') &&
        localStorage.getItem('zo_device_secret');
      
      if (hasCreds && !hasFetchedRef.current) {
        devLog.log('🔄 Credentials available, fetching Founder NFTs');
        fetchFounderNFTs();
      }
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('zoLoginSuccess', handleLoginSuccess);
      clearInterval(checkInterval);
    };
  }, []);

  return { nfts, isLoading, error };
}

