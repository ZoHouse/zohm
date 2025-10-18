'use client';

import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, LinkIcon, Loader2, X } from 'lucide-react';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { usePrivy } from '@privy-io/react-auth';
import { getUnicornForAddress } from '@/lib/unicornAvatars';

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
  const balance = 0; // Placeholder - will be connected to actual balance later

  const allWallets = userProfile?.wallets || [];
  const embeddedWallets = allWallets.filter(w => w.is_embedded);
  const externalWallets = allWallets.filter(w => !w.is_embedded);
  
  const evmWallets = allWallets.filter(w => 
    w.chain_type === 'ethereum' || w.chain_type === 'avalanche' || w.chain_type === 'polygon' || w.chain_type === 'base'
  );
  const solanaWallets = allWallets.filter(w => w.chain_type === 'solana');

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
    <div className="fixed inset-0 z-[9999]">
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
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-orange-400 to-pink-500 rounded-3xl blur-2xl opacity-70 animate-pulse"></div>
        
        {/* Main content card with pink-orange gradient */}
        <div className="relative bg-gradient-to-br from-pink-100 via-orange-100 to-pink-200 backdrop-blur-xl rounded-3xl shadow-2xl border-4 border-white flex flex-col overflow-hidden h-full">
          {/* Header - matching dashboard structure */}
          <div className="flex items-center justify-between p-6 border-b-2 border-white/50">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 transition-colors shadow-md flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-gray-900" />
            </button>
            
            {/* Profile Picture with Name - centered */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden flex-shrink-0">
                <img
                  src={userProfile?.pfp || getUnicornForAddress(primaryWalletAddress || userProfile?.id || '')}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-600 whitespace-nowrap">
                {userProfile?.name || 'User'}'s wallet
              </span>
            </div>
            
            {/* Colorful dots decoration */}
            <div className="flex space-x-1 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto pb-6 pt-6 px-4 space-y-6">
              
              {/* Balance Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-orange-400 rounded-3xl blur-xl opacity-50"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-4 border-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-500 text-sm font-medium mb-1">Your Balance</div>
                      <div className="text-gray-900 text-4xl font-black">{balance.toLocaleString()} 🦄</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embedded Wallets Section */}
              {embeddedWallets.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl blur-xl opacity-30"></div>
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-4 border-white">
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">✨</span> Embedded Wallets (Created by Privy)
                    </h3>
                    <div className="space-y-3">
                      {embeddedWallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border-2 border-green-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-bold uppercase">
                                {wallet.chain_type}
                              </span>
                              {wallet.is_primary && (
                                <span className="px-2 py-0.5 bg-purple-500 text-white rounded-full text-xs font-bold">
                                  PRIMARY
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
                                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"
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
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            >
                              {copiedAddress === wallet.address ? (
                                <Check size={18} className="text-green-600" />
                              ) : (
                                <Copy size={18} className="text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* External Wallets Section */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-30"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-4 border-white">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="mr-2">👛</span> External Wallets
                    </span>
                    <button
                      onClick={handleLinkWallet}
                      disabled={isLinkingWallet}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isLinkingWallet ? (
                        <><Loader2 size={16} className="animate-spin" /> Linking...</>
                      ) : (
                        <><LinkIcon size={16} /> Connect Wallet</>
                      )}
                    </button>
                  </h3>
                  
                  {externalWallets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No external wallets connected</p>
                      <p className="text-xs mt-1">Click "Connect Wallet" to link Phantom, Solflare, MetaMask, etc.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {externalWallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border-2 border-purple-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-purple-500 text-white rounded-full text-xs font-bold uppercase">
                                {wallet.chain_type}
                              </span>
                              {wallet.is_primary && (
                                <span className="px-2 py-0.5 bg-pink-500 text-white rounded-full text-xs font-bold">
                                  PRIMARY
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
                                className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"
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
                              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              {copiedAddress === wallet.address ? (
                                <Check size={18} className="text-purple-600" />
                              ) : (
                                <Copy size={18} className="text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chain Summary */}
              <div className="grid grid-cols-2 gap-4">
                {/* EVM Wallets */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border-2 border-white text-center">
                    <div className="text-2xl font-black text-gray-900">{evmWallets.length}</div>
                    <div className="text-xs text-gray-600 font-semibold">EVM Wallets</div>
                  </div>
                </div>
                
                {/* Solana Wallets */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border-2 border-white text-center">
                    <div className="text-2xl font-black text-gray-900">{solanaWallets.length}</div>
                    <div className="text-xs text-gray-600 font-semibold">Solana Wallets</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          {/* Pink-Orange footer line */}
          <div className="h-2 bg-gradient-to-r from-pink-500 via-orange-400 to-pink-500"></div>
        </div>
      </div>
    </div>
  );
};

export default WalletOverlay;

