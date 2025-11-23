import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/zo-api/profile';
import { supabase } from '@/lib/supabase';

export interface FounderNFT {
  token_id: string;
  name: string;
  video: string; // Video URL from CDN
}

export function useFounderNFTs() {
  const [nfts, setNfts] = useState<FounderNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          console.log('No user ID, skipping founder NFTs fetch');
          setNfts([]);
          setIsLoading(false);
          return;
        }

        // Fetch user data from Supabase (includes device credentials and access token)
        console.log('🔑 Fetching Founder NFTs with device credentials from localStorage');
        
        // Get credentials from localStorage (they're now saved there after login)
        const accessToken = localStorage.getItem('zo_access_token');
        const deviceId = localStorage.getItem('zo_device_id');
        const deviceSecret = localStorage.getItem('zo_device_secret');
          
        if (!accessToken) {
          console.log('No access token in Supabase, skipping founder NFTs fetch');
          setNfts([]);
          setIsLoading(false);
          return;
        }

        if (!deviceId || !deviceSecret) {
          console.log('No device credentials in Supabase, skipping founder NFTs fetch');
          setNfts([]);
          setIsLoading(false);
          return;
        }

        console.log('🔑 Fetching Founder NFTs with device credentials from Supabase');
        console.log('📊 Credentials:', {
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
        
        console.log('📡 ZO API Profile Result:', {
          success: result.success,
          hasProfile: !!result.profile,
          error: result.error,
          founderTokensCount: result.profile?.founder_tokens?.length || 0,
        });
        
        if (!result.success || !result.profile) {
          console.warn('⚠️ Profile fetch failed:', result.error);
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

        console.log('✅ Loaded', nftsWithImages.length, 'Founder NFTs');
        setNfts(nftsWithImages);

      } catch (err) {
        console.warn('⚠️ Could not fetch Founder NFTs:', err);
        // Don't show error to user, just silently fail
        setError(null);
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFounderNFTs();
  }, []);

  return { nfts, isLoading, error };
}

