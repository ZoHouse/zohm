'use client';

import React from 'react';
import ProfilePanel from './ProfilePanel';
import { X } from 'lucide-react';
import { usePrivyUser } from '@/hooks/usePrivyUser';

interface DashboardOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
}

const DashboardOverlay: React.FC<DashboardOverlayProps> = ({ isVisible, onClose, onOpenWallet }) => {
  const { authenticated, primaryWalletAddress } = usePrivyUser();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Close backdrop - semi-transparent to show map */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container with rainbow theme */}
      <div className="relative w-[95vw] max-w-4xl h-[90vh] mx-auto my-[5vh] flex flex-col overflow-hidden pointer-events-auto">
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-orange-400 to-pink-500 rounded-3xl blur-2xl opacity-70 animate-pulse"></div>
        
        {/* Main content card with vibrant pink-orange gradient */}
        <div className="relative bg-gradient-to-br from-pink-100 via-orange-100 to-pink-200 backdrop-blur-xl rounded-3xl shadow-2xl border-4 border-white flex flex-col overflow-hidden h-full">
          {/* Header with colorful elements */}
          <div className="flex items-center justify-between p-6 border-b-2 border-white/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-xl">🦄</span>
              </div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-600">
                Dashboard
              </h2>
            </div>
            
            {/* Colorful dots decoration */}
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 transition-all shadow-md"
                aria-label="Close dashboard"
              >
                <X size={18} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
          {authenticated ? (
            <div className="max-w-2xl mx-auto pb-6 pt-6 px-4">
              <ProfilePanel onOpenWallet={onOpenWallet} />
            </div>
            ) : (
              <div className="flex flex-col space-y-6 p-8 h-full items-center justify-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-xl mb-4">
                  <span className="text-4xl">🔒</span>
                </div>
                <p className="text-2xl font-bold text-center text-gray-800">Not authenticated</p>
                <p className="text-base text-center text-gray-600">Please log in to view your magical dashboard</p>
              </div>
            )}
          </div>
          
          {/* Pink-Orange footer line */}
          <div className="h-2 bg-gradient-to-r from-pink-500 via-orange-400 to-pink-500"></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverlay; 