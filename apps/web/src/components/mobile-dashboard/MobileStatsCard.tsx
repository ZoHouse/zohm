'use client';

import React from 'react';
import { DashboardAssets } from '@/styles/dashboard-tokens';

interface MobileStatsCardProps {
  balance: number;
  quantumSyncs: number;
  bestScore: number;
  uniqueLocations: number;
  multiplier: number;
  currentProgress: number;
  nextMilestone: number;
  milestones: number[];
}

const MobileStatsCard: React.FC<MobileStatsCardProps> = ({ 
  balance,
  quantumSyncs,
  bestScore,
  uniqueLocations,
  multiplier,
  currentProgress,
  nextMilestone,
  milestones
}) => {
  // Calculate progress percentage
  const progressPercent = (currentProgress / nextMilestone) * 100;
  
  return (
    <div 
      className="w-[238px] mx-auto flex flex-col gap-3 px-6 py-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
      }}
    >
      {/* Balance Display with Coin */}
      <div 
        className="flex items-center justify-end gap-[5.8px] px-[11.7px] py-[5.8px] rounded-full"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <span 
          className="font-rubik font-normal text-white text-right"
          style={{
            fontSize: '17.538px',
            lineHeight: '26.308px',
            letterSpacing: '0.1754px',
          }}
        >
          {balance}
        </span>
        {/* Multi-layer coin (reuse from desktop) */}
        <div className="relative w-[23.4px] h-[23.4px] rounded-full overflow-hidden">
          <img 
            src={DashboardAssets.statIcons.coin1}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <img 
            src={DashboardAssets.statIcons.coin2}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <img 
            src={DashboardAssets.statIcons.coin3}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
      
      {/* Stats Rows */}
      <div className="flex flex-col gap-1">
        <StatRow label="Quantum Syncs" value={quantumSyncs} />
        <StatRow label="Best Score" value={bestScore} />
        <StatRow label="Unique Locations" value={uniqueLocations} />
      </div>
      
      {/* Multiplier Tag */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-end">
          <div 
            className="flex items-center justify-end px-2 py-1 rounded-full"
            style={{ border: '1px solid rgba(255, 255, 255, 0.16)' }}
          >
            <span 
              className="font-rubik font-normal text-white text-right"
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                letterSpacing: '0.12px',
              }}
            >
              {multiplier.toFixed(2)}x
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex flex-col gap-1">
          {/* Bar */}
          <div className="flex w-full h-1">
            <div 
              className="bg-white h-full rounded-l-2xl"
              style={{ width: `${progressPercent}%` }}
            />
            <div 
              className="bg-white/10 h-full rounded-r-2xl"
              style={{ width: `${100 - progressPercent}%` }}
            />
          </div>
          
          {/* Milestone labels */}
          <div className="flex items-center justify-between font-rubik font-medium">
            <span 
              className="text-white/44"
              style={{ fontSize: '10px', lineHeight: '18px', letterSpacing: '0.1px' }}
            >
              {milestones[0]}
            </span>
            <span 
              className="text-white"
              style={{ fontSize: '12px', lineHeight: '18px', letterSpacing: '0.12px' }}
            >
              {milestones[1]}
            </span>
            <span 
              className="text-white/44"
              style={{ fontSize: '10px', lineHeight: '18px', letterSpacing: '0.1px' }}
            >
              {milestones[2]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat rows
const StatRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-end justify-between gap-3 h-[18px]">
    <span 
      className="font-rubik font-normal text-white/44"
      style={{
        fontSize: '12px',
        lineHeight: '18px',
        letterSpacing: '0.12px',
      }}
    >
      {label}
    </span>
    <span 
      className="font-rubik font-medium text-white text-right"
      style={{
        fontSize: '12px',
        lineHeight: '18px',
        letterSpacing: '0.12px',
      }}
    >
      {value}
    </span>
  </div>
);

export default MobileStatsCard;

