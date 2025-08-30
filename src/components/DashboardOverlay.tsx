'use client';

import React from 'react';
import ProfilePanel from './ProfilePanel';
import MainQuestCard from './MainQuestCard';
import SideQuestCard from './SideQuestCard';
import { X } from 'lucide-react';

interface DashboardOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const DashboardOverlay: React.FC<DashboardOverlayProps> = ({ isVisible, onClose }) => {
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
          <h2 className="text-xl font-bold">Dashboard</h2>
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
              <ProfilePanel />
            </div>
          </div>

          {/* Right: Cards */}
          <div className="lg:col-span-2 h-full grid grid-rows-2 gap-4 overflow-hidden">
            <div className="paper-card">
              <MainQuestCard />
            </div>
            <div className="paper-card">
              <SideQuestCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverlay; 