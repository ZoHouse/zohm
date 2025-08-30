'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/lib/supabase';

interface WalletConnectButtonProps {
  onProfileClick?: () => void;
  onProfileSetupClick?: () => void;
}

export default function WalletConnectButton({ onProfileClick, onProfileSetupClick }: WalletConnectButtonProps) {
  const { 
    isConnected, 
    address, 
    isLoading, 
    error, 
    connectWallet, 
    disconnectWallet, 
    formatAddress 
  } = useWallet();
  
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  // Check if user exists in Supabase members table
  const checkUserExists = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setIsCheckingUser(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('wallet')
        .eq('wallet', walletAddress.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user existence:', error);
        setUserExists(false);
        return;
      }

      // If data exists, user is in the table
      setUserExists(!!data);
    } catch (error) {
      console.error('Exception checking user existence:', error);
      setUserExists(false);
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Check user existence when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkUserExists(address);
    } else {
      setUserExists(null);
    }
  }, [isConnected, address]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setUserExists(null);
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleProfileSetupClick = () => {
    if (onProfileSetupClick) {
      onProfileSetupClick();
    }
  };

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 z-30">
        <button className="px-4 py-2 bg-[#333] text-[#f4f1ea] rounded-lg text-sm font-medium opacity-75 cursor-not-allowed border-2 border-[#1a1a1a] shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
          Connecting...
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-4 left-4 z-30">
        <button 
          onClick={handleConnect}
          className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#333] text-[#f4f1ea] rounded-lg text-sm font-medium transition-colors border-2 border-[#1a1a1a] shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
        >
          Retry Connect
        </button>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="absolute top-4 left-4 z-30">
        <div className="flex items-center gap-2">
          {isCheckingUser ? (
            <button className="px-3 py-2 bg-[#1a1a1a] text-[#f4f1ea] rounded-lg text-sm font-medium border-2 border-[#1a1a1a] shadow-[3px_3px_0px_rgba(0px,0px,0px,0.2)] opacity-75 cursor-not-allowed">
              Checking...
            </button>
          ) : userExists ? (
            <button 
              onClick={handleProfileClick}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#333] text-[#f4f1ea] rounded-lg text-sm font-medium border-2 border-[#1a1a1a] shadow-[3px_3px_0px_rgba(0px,0px,0px,0.2)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.3)] transition-colors cursor-pointer"
            >
              Profile
            </button>
          ) : (
            <button 
              onClick={handleProfileSetupClick}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium border-2 border-blue-500 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.3)] transition-colors cursor-pointer"
            >
              Profile Setup
            </button>
          )}
          <button 
            onClick={handleDisconnect}
            className="px-4 py-2 bg-[#f4f1ea] hover:bg-[#e8e4d8] text-[#1a1a1a] rounded-lg text-sm font-medium transition-colors border-2 border-[#1a1a1a] shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-30">
      <button 
        onClick={handleConnect}
        className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#333] text-[#f4f1ea] rounded-lg text-sm font-medium transition-colors border-2 border-[#1a1a1a] shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
      >
        Connect Wallet
      </button>
    </div>
  );
}
