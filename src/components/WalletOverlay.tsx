'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useProfileGate } from '@/hooks/useProfileGate';
import { getUnicornForAddress } from '@/lib/unicornAvatars';

interface WalletOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const WalletOverlay: React.FC<WalletOverlayProps> = ({ isVisible, onClose }) => {
  const { address } = useWallet();
  const { memberProfile } = useProfileGate();
  const balance = 0; // Placeholder - will be connected to actual balance later

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
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
                  src={memberProfile?.pfp || getUnicornForAddress(address || '')}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-600 whitespace-nowrap">
                {memberProfile?.name || 'User'}'s wallet
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
            <div className="max-w-2xl mx-auto pb-6 pt-6 px-4 flex flex-col items-center">
              {/* Wallet Card - Matching theme */}
              <div className="relative mb-8 w-full max-w-md">
          {/* Glowing pink-orange border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-orange-400 rounded-3xl blur-xl opacity-50"></div>
          
          {/* Main card */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white">
            {/* Colorful dots decoration */}
            <div className="absolute top-4 right-4 flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>

            {/* Balance Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-gray-500 text-sm font-medium mb-1">Your Balance</div>
                <div className="text-gray-900 text-6xl font-black mb-2">
                  {balance.toLocaleString()}
                </div>
              </div>
              
              {/* Animated Unicorn Token */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-xl opacity-50"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-4xl">🦄</span>
                </div>
              </div>
            </div>
            
            {/* Unicorn Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-xs font-semibold">🦄 Unicorn Status</span>
                <span className="text-gray-500 text-xs font-medium">{balance.toLocaleString()} / 1,000,000</span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                {/* Progress fill with pink-orange gradient */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((balance / 1000000) * 100, 100)}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className="text-center mt-1">
                {balance >= 1000000 ? (
                  <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-600">
                    🎉 You're a Unicorn! 🦄
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    {((balance / 1000000) * 100).toFixed(2)}% to becoming a unicorn
                  </span>
                )}
              </div>
            </div>
            
            {/* Wallet Address */}
            <div className="text-center">
              <div className="text-gray-500 text-xs font-medium mb-1">Wallet Address</div>
              <div className="text-gray-900 font-mono text-sm font-semibold">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "0x..."}
              </div>
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

