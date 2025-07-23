'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, DEV_MODE } from '@/config/contracts';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  role: 'Founder' | 'Member' | null;
}

interface UserLocationCoords {
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    ethereum?: any;
    userState?: {
      wallet?: string;
      role?: string;
      founderNftCount?: number;
    };
    userLocationCoords?: UserLocationCoords;
  }
}

// Use configuration from contracts.ts
const FOUNDER_NFT_CONTRACT = {
  address: CONTRACTS.FOUNDER_NFT.address,
  abi: CONTRACTS.FOUNDER_NFT.abi
};

export const useWallet = () => {
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
  const checkFounderNFT = useCallback(async (address: string) => {
    try {
      console.log('🔍 Checking Founder NFT for address:', address);
      
      // Check if we should bypass NFT check in development mode
      if (DEV_MODE.BYPASS_NFT_CHECK) {
        console.log('🔧 Development mode: Bypassing NFT check');
        
        if (typeof window !== 'undefined') {
          window.userState = window.userState || {};
          window.userState.role = 'Founder';
          window.userState.founderNftCount = 1;
        }

        setWalletState(prev => ({
          ...prev,
          role: 'Founder'
        }));

        return { hasNFT: true, count: 1 };
      }
      
      // Create provider and contract instance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        FOUNDER_NFT_CONTRACT.address,
        FOUNDER_NFT_CONTRACT.abi,
        provider
      );

      // Check balance
      const balance = await contract.balanceOf(address);
      const nftCount = Number(balance);
      const hasFounderNFT = nftCount > 0;

      console.log('🎫 Founder NFT balance:', nftCount);

      if (hasFounderNFT) {
        // Update role in state and window.userState
        if (typeof window !== 'undefined') {
          window.userState = window.userState || {};
          window.userState.role = 'Founder';
          window.userState.founderNftCount = nftCount;
        }

        setWalletState(prev => ({
          ...prev,
          role: 'Founder'
        }));

        return { hasNFT: true, count: nftCount };
      } else {
        if (typeof window !== 'undefined') {
          window.userState = window.userState || {};
          window.userState.role = 'Member';
          window.userState.founderNftCount = 0;
        }

        setWalletState(prev => ({
          ...prev,
          role: 'Member'
        }));

        return { hasNFT: false, count: 0 };
      }

    } catch (error: any) {
      console.error('Error checking Founder NFT:', error);
      setWalletState(prev => ({
        ...prev,
        error: `NFT verification failed: ${error.message || 'Unknown error'}`
      }));

      return { hasNFT: false, count: 0 };
    }
  }, []);

  // Fetch wallet PFP from ENS or other sources
  const fetchWalletPFP = useCallback(async (address: string) => {
    try {
      console.log('🖼️ Fetching PFP for address:', address);
      
      // Try ENS avatar first
      const provider = new ethers.BrowserProvider(window.ethereum);
      const ensName = await provider.lookupAddress(address);
      
      if (ensName) {
        const resolver = await provider.getResolver(ensName);
        if (resolver) {
          const avatar = await resolver.getAvatar();
          if (avatar) {
            console.log('✅ Found ENS avatar:', avatar);
            return avatar;
          }
        }
      }

      // Fallback to Ethereum Avatar API
      const avatarUrl = `https://metadata.ens.domains/mainnet/avatar/${address}`;
      const response = await fetch(avatarUrl);
      
      if (response.ok) {
        const avatarData = await response.text();
        if (avatarData && avatarData !== 'null' && !avatarData.includes('error')) {
          console.log('✅ Found avatar via ENS API:', avatarData);
          return avatarData;
        }
      }

      // Generate a default avatar using the wallet address
      const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=1a1a1a`;
      console.log('🔄 Using default generated avatar');
      return defaultAvatar;

    } catch (error) {
      console.error('Error fetching PFP:', error);
      // Return a default avatar on error
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=1a1a1a`;
    }
  }, []);

  // Sync with Supabase
  const syncWithSupabase = useCallback(async (address: string, role: string, memberData: any) => {
    try {
      // Check if geolocation is available
      let lat = 0, lng = 0;

      if (typeof window !== 'undefined' && window.userLocationCoords) {
        const { lat: userLat, lng: userLng } = window.userLocationCoords;
        lat = userLat;
        lng = userLng;
      }

      // Import Supabase client dynamically to avoid SSR issues
      const { supabase } = await import('@/lib/supabase');

      // Prepare member data with all new fields
      const finalMemberData = {
        wallet: address,
        role: role,
        pfp: memberData.pfp || null,
        founder_nfts_count: memberData.founder_nfts_count || 0,
        lat: memberData.lat || lat,
        lng: memberData.lng || lng,
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
      const { hasNFT, count } = await checkFounderNFT(address);
      
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
      const memberData = {
        wallet: address,
        role: hasNFT ? 'Founder' : 'Member',
        pfp: defaultAvatar,
        founder_nfts_count: count,
        ...locationData,
        last_seen: new Date().toISOString()
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