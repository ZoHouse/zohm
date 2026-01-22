'use client';

import React from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';
import DashboardHeader from './DashboardHeader';
import LeftSidebar from './LeftSidebar';
import CenterColumn from './CenterColumn';
import RightSidebar from './RightSidebar';
import { DashboardSpacing, DashboardAssets } from '@/styles/dashboard-tokens';

interface EventData {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

interface DesktopDashboardProps {
  onClose?: () => void;
  events?: EventData[];
  onLaunchGame?: (userId: string) => void;
}

const DesktopDashboard: React.FC<DesktopDashboardProps> = ({ onClose, events = [], onLaunchGame }) => {
  const { userProfile, isLoading, reloadProfile } = useZoAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[9999]"
      style={{
        backgroundColor: '#000000',
      }}
    >
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${DashboardAssets.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <DashboardHeader onClose={onClose} />
      
      {/* Main Body: 3 Column Layout */}
        <div 
          className="flex items-start justify-between overflow-y-auto flex-1"
          style={{
            gap: DashboardSpacing.xl,
            padding: DashboardSpacing.xl,
          }}
        >
        {/* Left Sidebar */}
        <LeftSidebar userProfile={userProfile} />
        
        {/* Center Column */}
          <CenterColumn userProfile={userProfile} onOpenMap={onClose} onLaunchGame={onLaunchGame} reloadProfile={reloadProfile} />
        
        {/* Right Sidebar */}
          <RightSidebar userProfile={userProfile} events={events} />
        </div>
      </div>
    </div>
  );
};

export default DesktopDashboard;

