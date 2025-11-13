'use client';

import React from 'react';
import ProfilePanel from './ProfilePanel';
import { X } from 'lucide-react';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { GlowCard } from '@/components/ui';

interface DashboardOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
}

const DashboardOverlay: React.FC<DashboardOverlayProps> = ({ isVisible, onClose, onOpenWallet }) => {
  const { authenticated, primaryWalletAddress } = usePrivyUser();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10001]">
      {/* Close backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-[95vw] max-w-4xl h-[90vh] mx-auto my-[5vh] flex flex-col overflow-hidden pointer-events-auto">
        {/* Glowing border effect - adapted to red theme */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff4d6d] via-[#ff3355] to-[#ff4d6d] rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
        
        {/* Main content card with Glow UI */}
        <GlowCard className="relative flex flex-col overflow-hidden h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff3355] flex items-center justify-center shadow-lg p-1.5">
                <img 
                  src="/Cultural Stickers/FollowYourHeart.png" 
                  alt="Follow Your Heart" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-black">
                Dashboard
              </h2>
            </div>
            
            {/* Decorative dots with red theme */}
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d] animate-pulse" style={{ boxShadow: '0 0 10px rgba(255,77,109,0.6)' }}></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d] animate-pulse" style={{ animationDelay: '0.2s', boxShadow: '0 0 10px rgba(255,77,109,0.6)' }}></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d] animate-pulse" style={{ animationDelay: '0.4s', boxShadow: '0 0 10px rgba(255,77,109,0.6)' }}></div>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all border border-white/40"
                aria-label="Close dashboard"
              >
                <X size={18} className="text-black" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
          {authenticated ? (
            <div className="max-w-2xl mx-auto pb-6">
              <ProfilePanel onOpenWallet={onOpenWallet} />
            </div>
            ) : (
              <div className="flex flex-col space-y-6 p-8 h-full items-center justify-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff3355] flex items-center justify-center shadow-xl mb-4">
                  <span className="text-4xl">🔒</span>
                </div>
                <p className="text-2xl font-bold text-center text-black">Not authenticated</p>
                <p className="text-base text-center text-gray-700">Please log in to view your dashboard</p>
              </div>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  );
};

export default DashboardOverlay; 