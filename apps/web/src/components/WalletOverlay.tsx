'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, LinkIcon, Loader2, X } from 'lucide-react';
import { useZoAuth } from '@/hooks/useZoAuth';
import { getUnicornForAddress } from '@/lib/unicornAvatars';
import { GlowCard } from '@/components/ui';
import { ethers } from 'ethers';
import { setPrimaryWallet } from '@/lib/userDb';
import { devLog } from '@/lib/logger';

interface WalletOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const WalletOverlay: React.FC<WalletOverlayProps> = ({ isVisible, onClose }) => {
  const { userProfile, reloadProfile } = useZoAuth();
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [settingPrimaryFor, setSettingPrimaryFor] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState('$ZO');

  const primaryWalletAddress = userProfile?.primary_wallet_address || userProfile?.primary_wallet?.address || null;

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
        const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

        // Fetch balance and token info
        const [balanceRaw, decimals, symbol] = await Promise.all([
          contract.balanceOf(primaryWalletAddress),
          contract.decimals(),
          contract.symbol()
        ]);

        // Format balance
        const formattedBalance = ethers.formatUnits(balanceRaw, decimals);
        
        // Format to 2 decimal places nicely
        const balanceNum = parseFloat(formattedBalance);
        const displayBalance = balanceNum.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });

        setBalance(displayBalance);
        setTokenSymbol(symbol || '$ZO');
      } catch (error) {
        devLog.error('Error fetching token balance:', error);
        // Fallback or keep existing
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchTokenBalance();
  }, [isVisible, primaryWalletAddress]);

  // Function to handle linking a new wallet
  const handleLinkWallet = async () => {
    setIsLinkingWallet(true);
    try {
      // TODO: Implement wallet linking via ZO API
      showNotification('error', 'Wallet linking coming soon');
    } catch (error) {
      devLog.error('Failed to link wallet:', error);
      showNotification('error', 'Failed to link wallet');
    } finally {
      setIsLinkingWallet(false);
    }
  };

  // Function to set a wallet as primary
  const handleSetPrimary = async (address: string) => {
    if (!userProfile?.id) return;
    
    setSettingPrimaryFor(address);
    try {
      const success = await setPrimaryWallet(userProfile.id, address);
      if (success) {
        await reloadProfile();
        showNotification('success', 'Primary wallet updated');
      } else {
        throw new Error('Failed to set primary wallet');
      }
    } catch (error) {
      devLog.error('Failed to set primary wallet:', error);
      showNotification('error', 'Failed to update primary wallet');
    } finally {
      setSettingPrimaryFor(null);
    }
  };

  // Helper to copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
    showNotification('success', 'Address copied to clipboard');
  };

  // Helper to show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-4">
        <GlowCard className="w-full overflow-hidden border-white/10 bg-black/90 text-white shadow-2xl">
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-white/10 p-4">
            <h2 className="text-xl font-bold">My Wallets</h2>
            <button 
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Notification Toast */}
          {notification && (
            <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}>
              {notification.message}
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Balance Section */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl border border-white/10">
              <span className="text-sm text-gray-400 mb-1">Total Balance</span>
              <div className="flex items-baseline gap-1">
                {isLoadingBalance ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <>
                    <span className="text-4xl font-bold text-white">{balance}</span>
                    <span className="text-lg font-medium text-zo-accent">{tokenSymbol}</span>
                  </>
                )}
              </div>
              {primaryWalletAddress && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-black/40 px-3 py-1.5 rounded-full">
                  <span>{truncateAddress(primaryWalletAddress)}</span>
                  <button 
                    onClick={() => copyToClipboard(primaryWalletAddress)}
                    className="hover:text-white transition-colors"
                  >
                    {copiedAddress === primaryWalletAddress ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>

            {/* Wallets List */}
            <div className="space-y-4">
              {/* Embedded Wallets */}
              {embeddedWallets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Embedded Wallets</h3>
                  <div className="space-y-2">
                    {embeddedWallets.map((wallet) => (
                      <div 
                        key={wallet.address} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          wallet.address === primaryWalletAddress 
                            ? 'bg-white/10 border-zo-accent/50 shadow-[0_0_10px_rgba(207,255,80,0.1)]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs overflow-hidden">
                            <img 
                              src={getUnicornForAddress(wallet.address)} 
                              alt="Wallet Avatar" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-sm">
                                {truncateAddress(wallet.address)}
                              </span>
                              {wallet.address === primaryWalletAddress && (
                                <span className="px-1.5 py-0.5 rounded bg-zo-accent/20 text-zo-accent text-[10px] font-bold uppercase">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {wallet.chain_type} • Embedded
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => copyToClipboard(wallet.address)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Copy Address"
                          >
                            {copiedAddress === wallet.address ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          {wallet.address !== primaryWalletAddress && (
                            <button
                              onClick={() => handleSetPrimary(wallet.address)}
                              disabled={settingPrimaryFor === wallet.address}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-zo-accent transition-colors"
                              title="Set as Primary"
                            >
                              {settingPrimaryFor === wallet.address ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <span className="text-xs font-medium">Make Primary</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Wallets */}
              {externalWallets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Connected Wallets</h3>
                  <div className="space-y-2">
                    {externalWallets.map((wallet) => (
                      <div 
                        key={wallet.address} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          wallet.address === primaryWalletAddress 
                            ? 'bg-white/10 border-zo-accent/50 shadow-[0_0_10px_rgba(207,255,80,0.1)]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-xs overflow-hidden">
                            <img 
                              src={getUnicornForAddress(wallet.address)} 
                              alt="Wallet Avatar" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-sm">
                                {truncateAddress(wallet.address)}
                              </span>
                              {wallet.address === primaryWalletAddress && (
                                <span className="px-1.5 py-0.5 rounded bg-zo-accent/20 text-zo-accent text-[10px] font-bold uppercase">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {wallet.chain_type} • {wallet.wallet_client_type || 'External'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => copyToClipboard(wallet.address)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Copy Address"
                          >
                            {copiedAddress === wallet.address ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          {wallet.address !== primaryWalletAddress && (
                            <button
                              onClick={() => handleSetPrimary(wallet.address)}
                              disabled={settingPrimaryFor === wallet.address}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-zo-accent transition-colors"
                              title="Set as Primary"
                            >
                              {settingPrimaryFor === wallet.address ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <span className="text-xs font-medium">Make Primary</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={handleLinkWallet}
              disabled={isLinkingWallet}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center gap-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLinkingWallet ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LinkIcon className="h-5 w-5" />
              )}
              Link New Wallet
            </button>
          </div>
        </GlowCard>
      </div>
    </div>
  );
};

export default WalletOverlay;
