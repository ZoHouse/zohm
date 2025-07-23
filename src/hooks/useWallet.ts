'use client';

import { useState, useCallback } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  role: string;
  isLoading: boolean;
  error: string | null;
}

interface NFTData {
  tokenId: string;
  name: string;
  image: string;
  description?: string;
}

interface LocationData {
  lat: number;
  lng: number;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

// Global types for window object
declare global {
  interface Window {
    ethereum?: EthereumProvider;
    userLocationCoords?: LocationData;
    userState?: {
      wallet?: string;
      role?: string;
      founderNftCount?: number;
    };
  }
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    role: 'Member',
    isLoading: false,
    error: null
  });

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Connect to wallet
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskInstalled()) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.'
      }));
      return null;
    }

    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletState(prev => ({
          ...prev,
          address,
          isConnected: true,
          isLoading: false
        }));

        return address;
      } else {
        throw new Error('No accounts found');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setWalletState(prev => ({
        ...prev,
        error: `Failed to connect wallet: ${errorMessage}`,
        isLoading: false
      }));
      return null;
    }
  }, [isMetaMaskInstalled]);

  // Check if user has founder NFT
  const checkFounderNFT = useCallback(async (address: string): Promise<boolean> => {
    try {
      // Check if user has founder NFT
      const response = await fetch(`/api/check-nft?address=${address}`);
      const data = await response.json();
      return data.hasNFT || false;
    } catch (error) {
      console.error('Error checking founder NFT:', error);
      return false;
    }
  }, []);

  // Sync with Supabase
  const syncWithSupabase = useCallback(async (address: string, role: string, memberData: NFTData) => {
    try {
      // Import Supabase client dynamically to avoid SSR issues
      const { supabase } = await import('@/lib/supabase');

      const finalMemberData = {
        wallet: address,
        role,
        name: memberData.name || '',
        bio: '',
        culture: '',
        pfp: memberData.image || '',
        founder_nfts_count: role === 'Founder' ? 1 : 0,
        last_seen: new Date().toISOString()
      };

      console.log('💾 Syncing with Supabase:', finalMemberData);

      const { data, error } = await supabase
        .from('members')
        .upsert(finalMemberData, { onConflict: 'wallet' });

      if (error) {
        console.error('Supabase sync error:', error);
        return false;
      }

      console.log('✅ Successfully synced with Supabase:', data);
      return true;
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      return false;
    }
  }, []);

  // Main quantum sync function
  const quantumSync = useCallback(async (): Promise<boolean> => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

      // Connect wallet
      const address = await connectWallet();
      if (!address) {
        return false;
      }

      // Check NFT balance and get count
      const hasNFT = await checkFounderNFT(address);
      
      // Use default avatar - user will select NFT via gallery
      const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=1a1a1a`;

      // Prepare member data with all new fields
      const memberData: NFTData = {
        tokenId: '', // Placeholder, will be fetched from NFT collection
        name: '', // Placeholder, will be fetched from NFT collection
        image: defaultAvatar,
        description: '' // Placeholder
      };

      // Sync with Supabase
      await syncWithSupabase(address, hasNFT ? 'Founder' : 'Member', memberData);

      setWalletState(prev => ({
        ...prev,
        role: hasNFT ? 'Founder' : 'Member',
        isLoading: false
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setWalletState(prev => ({
        ...prev,
        error: `Quantum sync failed: ${errorMessage}`,
        isLoading: false
      }));
      return false;
    }
  }, [connectWallet, checkFounderNFT, syncWithSupabase]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      isConnected: false,
      role: 'Member',
      isLoading: false,
      error: null
    });
  }, []);

  // Format address for display
  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    quantumSync,
    formatAddress,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };
} 