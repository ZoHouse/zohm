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
        
        // For now, just connect and let quantumSync handle role verification
        setWalletState(prev => ({
          ...prev,
          address,
          role: 'Member', // Default, will be updated by quantumSync
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
        wallet: address.toLowerCase(),
        role,
        name: memberData.name || null, // Use null instead of empty string
        bio: null,                     // This will trigger profile setup
        culture: null,                 // This will trigger profile setup
        lat: null,                     // This will trigger profile setup
        lng: null,                     // This will trigger profile setup
        pfp: memberData.image || null,
        founder_nfts_count: role === 'Founder' ? 1 : 0,
        last_seen: new Date().toISOString()
      };

      console.log('💾 Syncing with Supabase:', finalMemberData);

      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('members')
        .upsert(finalMemberData, { 
          onConflict: 'wallet',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Supabase upsert error:', error);
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
      console.log('🔍 NFT Check Result:', { address, hasNFT });
      
      // Use default avatar - user will select NFT via gallery
      const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=1a1a1a`;

      // Prepare member data with all new fields
      const memberData: NFTData = {
        tokenId: '', // Placeholder, will be fetched from NFT collection
        name: '', // Placeholder, will be fetched from NFT collection
        image: defaultAvatar,
        description: '' // Placeholder
      };

      // Determine the correct role
      const newRole = hasNFT ? 'Founder' : 'Member';
      console.log('🎯 Setting Role:', { hasNFT, newRole });
      
      // Sync with Supabase with the correct role
      await syncWithSupabase(address, newRole, memberData);
      
      // Force state update with the correct role
      setWalletState(prev => ({
        ...prev,
        role: newRole,
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

  // Manual role setter for testing (also updates database)
  const setRole = useCallback(async (role: string) => {
    if (!walletState.address) return;
    
    // Update state immediately
    setWalletState(prev => ({ ...prev, role }));
    
    // Also update database
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('members')
        .update({ role })
        .eq('wallet', walletState.address.toLowerCase());
      
      if (error) {
        console.error('Error updating role in database:', error);
      } else {
        console.log('✅ Role updated in database:', role);
      }
    } catch (error) {
      console.error('Exception updating role:', error);
    }
  }, [walletState.address]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    quantumSync,
    formatAddress,
    setRole,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };
} 