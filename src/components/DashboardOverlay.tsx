'use client';

import React from 'react';
import ProfilePanel from './ProfilePanel';
import MainQuestCard from './MainQuestCard';
import SideQuestCard from './SideQuestCard';
import MiniMap from './MiniMap';
import { X } from 'lucide-react';

interface DashboardOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const DashboardOverlay: React.FC<DashboardOverlayProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-lg"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col pointer-events-auto">
        {/* Header for Close Button */}
        <div className="relative flex-shrink-0 h-12 sm:h-16">
            <button
              onClick={onClose}
              className="absolute top-2 sm:top-4 right-0 glass-icon-button w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center z-10"
              aria-label="Close dashboard"
            >
              <X size={16} className="sm:w-5 sm:h-5" />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col lg:flex-row gap-3 sm:gap-6 h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)]">
            {/* Left Side: Profile Panel */}
            <div className="w-full lg:w-1/3 h-1/3 lg:h-full">
                <ProfilePanel />
            </div>

            {/* Right Side: Main Content */}
            <div className="w-full lg:w-2/3 h-2/3 lg:h-full flex flex-col gap-3 sm:gap-6">
                <div className="h-1/3 lg:h-1/4">
                    <MainQuestCard />
                </div>
                <div className="h-1/3 lg:h-1/4">
                    <SideQuestCard />
                </div>
                <div className="h-1/3 lg:h-1/2">
                    <MiniMap />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverlay; 