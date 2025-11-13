'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, LinkIcon, Loader2, X } from 'lucide-react';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { usePrivy } from '@privy-io/react-auth';
import { getUnicornForAddress } from '@/lib/unicornAvatars';
import { GlowCard } from '@/components/ui';
import { ethers } from 'ethers';

interface WalletOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const WalletOverlay: React.FC<WalletOverlayProps> = ({ isVisible, onClose }) => {
  const { userProfile, primaryWalletAddress, reloadProfile, changePrimaryWallet } = usePrivyUser();
  const { linkWallet } = usePrivy();
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [settingPrimaryFor, setSettingPrimaryFor] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState('$ZO');

  const allWallets = userProfile?.wallets || [];
  const embeddedWallets = allWallets.filter(w => w.is_embedded);
  const externalWallets = allWallets.filter(w => !w.is_embedded);
  
  const evmWallets = allWallets.filter(w => 
    w.chain_type === 'ethereum' || w.chain_type === 'avalanche' || w.chain_type === 'polygon' || w.chain_type === 'base'
  );
  const solanaWallets = allWallets.filter(w => w.chain_type === 'solana');

  // Fetch token balance when wallet overlay is visible and user has a wallet
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!isVisible || !primaryWalletAddress) {
        return;
      }

      setIsLoadingBalance(true);
      try {
        // Token configuration
        const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CUSTOM_TOKEN_ADDRESS || '0x111142C7eCAF39797b7865b82034269962142069';
        const RPC_URL = 'https://mainnet.base.org';
        
        // ERC-20 ABI for balanceOf, decimals, and symbol
        const ERC20_ABI = [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)'
        ];

        // Create provider and contract
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

        // Fetch balance, decimals, and symbol
        const [balanceRaw, decimals, symbol] = await Promise.all([
          tokenContract.balanceOf(primaryWalletAddress),
          tokenContract.decimals(),
          tokenContract.symbol()
        ]);

        // Format balance
        const formattedBalance = ethers.formatUnits(balanceRaw, decimals);
        const balanceNumber = parseFloat(formattedBalance);
        
        // Format to 2 decimal places if it's a large number, otherwise show more precision
        const displayBalance = balanceNumber >= 1 
          ? balanceNumber.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
          : balanceNumber.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });

        setBalance(displayBalance);
        setTokenSymbol(symbol);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchTokenBalance();
  }, [isVisible, primaryWalletAddress]);

  const handleLinkWallet = async () => {
    if (isLinkingWallet) return;
    
    try {
      setIsLinkingWallet(true);
      await linkWallet();
      setTimeout(async () => {
        await reloadProfile();
        setIsLinkingWallet(false);
      }, 1000);
    } catch (error) {
      console.error('Error linking wallet:', error);
      setIsLinkingWallet(false);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSetPrimary = async (walletAddress: string) => {
    if (settingPrimaryFor) return;
    
    try {
      setSettingPrimaryFor(walletAddress);
      const success = await changePrimaryWallet(walletAddress);
      
      if (success) {
        showNotification('success', 'Primary wallet updated!');
      } else {
        showNotification('error', 'Failed to set primary wallet');
      }
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      showNotification('error', 'Failed to set primary wallet');
    } finally {
      setSettingPrimaryFor(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10001]">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-top">
          <div className={`px-6 py-3 rounded-full shadow-lg border-2 border-white flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <Check size={20} />
            ) : (
              <X size={20} />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Close backdrop - semi-transparent to show map */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container matching dashboard */}
      <div className="relative w-[95vw] max-w-4xl h-[90vh] mx-auto my-[5vh] flex flex-col overflow-hidden pointer-events-auto">
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff4d6d]/40 via-[#ff8fa3]/30 to-[#ff4d6d]/40 rounded-3xl blur-3xl opacity-70"></div>
        
        {/* Main content card */}
        <GlowCard className="relative flex flex-col overflow-hidden h-full !p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-white/30 bg-white/10 backdrop-blur-xl">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 border border-white/40 text-black hover:bg-white/30 transition-all"
              aria-label="Close wallet"
            >
              <ArrowLeft size={18} />
            </button>
            
            {/* Profile Picture with Name - centered */}
            <div className="flex-1 flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border border-white/50 overflow-hidden shadow-lg">
                <img
                  src={userProfile?.pfp || getUnicornForAddress(primaryWalletAddress || userProfile?.id || '')}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start sm:items-center">
                <span className="text-xs uppercase tracking-[0.25em] text-gray-600">Wallet</span>
                <span className="text-xl font-black text-black whitespace-nowrap">{userProfile?.name || 'User'}&apos;s wallet</span>
              </div>
            </div>
            
            {/* Dots decoration */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d] shadow-[0_0_10px_rgba(255,77,109,0.6)] animate-pulse"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.4)] animate-pulse" style={{ animationDelay: '0.25s' }}></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff8fa3] shadow-[0_0_10px_rgba(255,143,163,0.6)] animate-pulse" style={{ animationDelay: '0.5s' }}></span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Balance Card */}
              <div className="relative">
                <GlowCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-gray-700 text-sm font-medium mb-1">Your Balance</div>
                      {isLoadingBalance ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={32} className="animate-spin text-[#ff4d6d]" />
                          <span className="text-gray-500 text-xl">Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-black text-4xl font-black">{balance}</span>
                          <div className="w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow-inner overflow-hidden">
                            <img 
                              src="/zotoken.png" 
                              alt={tokenSymbol} 
                              className="w-10 h-10 object-contain rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </GlowCard>
              </div>

              {/* Embedded Wallets Section */}
              {embeddedWallets.length > 0 && (
                <GlowCard>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="text-lg font-black text-black flex items-center">
                      <span className="mr-2">✨</span> Embedded Wallets
                    </span>
                  </div>
                  <div className="space-y-4">
                    {embeddedWallets.map((wallet) => (
                      <div key={wallet.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/25 px-4 py-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-white/30 backdrop-blur-sm border border-white/40 text-black rounded-full text-xs font-bold uppercase shadow-sm">
                              {wallet.chain_type}
                            </span>
                            {wallet.is_primary && (
                              <span className="px-3 py-1 bg-[#ff4d6d] border border-[#ff4d6d] text-white rounded-full text-xs font-bold shadow-sm">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-gray-700">
                            {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!wallet.is_primary && (
                            <button
                              onClick={() => handleSetPrimary(wallet.address)}
                              disabled={settingPrimaryFor === wallet.address}
                              className="px-4 py-2 bg-[#ff4d6d] hover:bg-[#ff3355] text-white text-xs font-semibold rounded-full transition-all disabled:opacity-50 shadow-md"
                            >
                              {settingPrimaryFor === wallet.address ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                'Set Primary'
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyAddress(wallet.address)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 border border-white/40 text-gray-700 hover:bg-white/30 transition-all"
                            aria-label="Copy wallet address"
                          >
                            {copiedAddress === wallet.address ? (
                              <Check size={16} className="text-[#ff4d6d]" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlowCard>
              )}

              {/* External Wallets Section */}
              <GlowCard>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <span className="text-lg font-black text-black flex items-center">
                    <span className="mr-2">👛</span> External Wallets
                  </span>
                  <button
                    onClick={handleLinkWallet}
                    disabled={isLinkingWallet}
                    className="flex items-center gap-2 px-5 py-2 bg-[#ff4d6d] hover:bg-[#ff3355] text-white rounded-full text-sm font-semibold shadow-lg transition-all disabled:opacity-50"
                  >
                    {isLinkingWallet ? (
                      <><Loader2 size={16} className="animate-spin" /> Linking...</>
                    ) : (
                      <><LinkIcon size={16} /> Connect Wallet</>
                    )}
                  </button>
                </div>
                  
                  {externalWallets.length === 0 ? (
                    <div className="text-center py-10 text-gray-600">
                      <p className="text-sm">No external wallets connected yet.</p>
                      <p className="text-xs mt-1">Connect Phantom, Solflare, MetaMask, and more in a tap.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {externalWallets.map((wallet) => (
                        <div key={wallet.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/25 px-4 py-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-white/30 backdrop-blur-sm border border-white/40 text-black rounded-full text-xs font-bold uppercase shadow-sm">
                                {wallet.chain_type}
                              </span>
                              {wallet.is_primary && (
                                <span className="px-3 py-1 bg-[#ff4d6d] border border-[#ff4d6d] text-white rounded-full text-xs font-bold shadow-sm">
                                  Primary
                                </span>
                              )}
                              {wallet.wallet_client_type && (
                                <span className="text-xs text-gray-600">
                                  via {wallet.wallet_client_type}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-gray-700">
                              {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!wallet.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(wallet.address)}
                                disabled={settingPrimaryFor === wallet.address}
                                className="px-4 py-2 bg-[#ff4d6d] hover:bg-[#ff3355] text-white text-xs font-semibold rounded-full transition-all disabled:opacity-50 shadow-md"
                              >
                                {settingPrimaryFor === wallet.address ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  'Set Primary'
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyAddress(wallet.address)}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 border border-white/40 text-gray-700 hover:bg-white/30 transition-all"
                              aria-label="Copy wallet address"
                            >
                              {copiedAddress === wallet.address ? (
                                <Check size={16} className="text-[#ff4d6d]" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </GlowCard>

              {/* Chain Summary */}
              <div className="grid grid-cols-2 gap-4">
                {/* EVM Wallets */}
                <div className="relative">
                  <GlowCard className="p-4 text-center">
                    <div className="text-2xl font-black text-black">{evmWallets.length}</div>
                    <div className="text-xs text-gray-600 font-semibold">EVM Wallets</div>
                  </GlowCard>
                </div>
                
                {/* Solana Wallets */}
                <div className="relative">
                  <GlowCard className="p-4 text-center">
                    <div className="text-2xl font-black text-black">{solanaWallets.length}</div>
                    <div className="text-xs text-gray-600 font-semibold">Solana Wallets</div>
                  </GlowCard>
                </div>
              </div>

            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
};

export default WalletOverlay;

