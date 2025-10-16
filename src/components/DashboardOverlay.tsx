'use client';

import React from 'react';
import ProfilePanel from './ProfilePanel';
import MainQuestCard from './MainQuestCard';
import SideQuestCard from './SideQuestCard';
import { X } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface DashboardOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const DashboardOverlay: React.FC<DashboardOverlayProps> = ({ isVisible, onClose }) => {
  const { isConnected, address } = useWallet();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Backdrop - subtle, no blur for paper UI */}
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Paper UI Modal Container */}
      <div className="relative paper-overlay w-[95vw] max-w-6xl h-[90vh] mx-auto flex flex-col overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img src="/dashboard.png" alt="Dashboard" className="w-8 h-8 object-contain" />
            <h2 className="text-xl font-bold">Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="paper-button w-8 h-8 flex items-center justify-center"
            aria-label="Close dashboard"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Left: Profile Panel */}
          <div className="lg:col-span-1 h-full overflow-hidden">
            <div className="h-full overflow-auto">
              {isConnected && address ? (
                <ProfilePanel />
              ) : (
                <div className="flex flex-col space-y-6 p-6 paper-card h-full items-center justify-center">
                  <p className="text-lg text-center">Wallet not connected</p>
                  <p className="text-sm text-center text-gray-500">Please connect your wallet to view the dashboard</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cards */}
          <div className="lg:col-span-2 h-full no-hover grid grid-rows-2 gap-4 overflow-hidden">
            <div className="paper-card no-hover">
              <MainQuestCard />
            </div>
            <div className="paper-card no-hover">
              <SideQuestCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverlay; 