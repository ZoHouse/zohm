'use client';

import { useState, useCallback, useEffect } from 'react';

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

// Global types for window object
declare global {
  interface Window {
    ethereum?: any;
    userLocationCoords?: LocationData;
    userState?: any;
  }
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isLoading: false,
    error: null,
    role: null
  });

  // Initialize wallet state from window.userState if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.userState?.wallet) {
      setWalletState(prev => ({
        ...prev,
        address: window.userState?.wallet || null,
        isConnected: !!window.userState?.wallet,
        role: (window.userState?.role as 'Founder' | 'Member') || null
      }));
    }
  }, []);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Connect to MetaMask
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskInstalled()) {
      setWalletState(prev => ({ ...prev, error: 'MetaMask is not installed.' }));
      return null;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found.');
      }

      const address = accounts[0];
      
      // Update window.userState
      if (typeof window !== 'undefined') {
        window.userState = { ...window.userState, wallet: address };
      }

      setWalletState(prev => ({
        ...prev,
        address,
        isConnected: true,
        isLoading: false
      }));

      console.log('🔗 Wallet connected:', address);
      return address;

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet'
      }));
      return null;
    }
  }, [isMetaMaskInstalled]);

  // Check Founder NFT balance and return count
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

  // Fetch wallet PFP from ENS or other sources
  const fetchWalletPFP = useCallback(async (address: string): Promise<string | null> => {
    try {
      // Fetch wallet PFP from NFT collection
      const response = await fetch(`/api/fetch-pfp?address=${address}`);
      const data = await response.json();
      return data.pfp || null;
    } catch (error) {
      console.error('Error fetching wallet PFP:', error);
      return null;
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

  // Main Quantum Sync function
  const quantumSync = useCallback(async () => {
    console.log('🧬 Initiating Quantum Sync...');
    
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const address = await connectWallet();
      if (!address) {
        throw new Error('Wallet connection failed. Please try again.');
      }

      // Check NFT balance and get count
      const hasNFT = await checkFounderNFT(address);
      
      // Use default avatar - user will select NFT via gallery
      const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=1a1a1a`;
      console.log('🖼️ Using default avatar, user can select NFT later');

      // Get location if available
      let locationData = {};
      if (typeof window !== 'undefined' && window.userLocationCoords) {
        locationData = {
          lat: window.userLocationCoords.lat,
          lng: window.userLocationCoords.lng
        };
      }

      // Prepare member data with all new fields
      const memberData: NFTData = {
        tokenId: '', // Placeholder, will be fetched from NFT collection
        name: '', // Placeholder, will be fetched from NFT collection
        image: defaultAvatar,
        description: '' // Placeholder
      };

      await syncWithSupabase(address, hasNFT ? 'Founder' : 'Member', memberData);

      setWalletState(prev => ({ ...prev, isLoading: false }));
      console.log('🎉 Quantum Sync completed successfully!');
      return true;

    } catch (error: any) {
      console.error('Quantum Sync failed:', error);
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Quantum Sync failed. Please check your wallet and try again.'
      }));
      return false;
    }
  }, [connectWallet, checkFounderNFT, syncWithSupabase]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      isConnected: false,
      isLoading: false,
      error: null,
      role: null
    });

    if (typeof window !== 'undefined') {
      window.userState = {};
    }

    console.log('🔌 Wallet disconnected');
  }, []);

  // Format address for display
  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, []);

  return {
    ...walletState,
    quantumSync,
    connectWallet,
    disconnectWallet,
    formatAddress,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };
}; 