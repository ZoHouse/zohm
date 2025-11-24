'use client';

import React from 'react';
import { GlowChip, GlowButton, GlowCard } from './index';

/**
 * GlowUIDemo - Showcase of the new Glow UI design system
 * 
 * This component demonstrates all the primitives and how they work together.
 * Use this as a reference when building new features.
 */
export const GlowUIDemo: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm p-8 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Glow UI Design System</h1>
          <p className="text-gray-400">Capsule-based components with translucent glow aesthetic</p>
        </div>

        {/* GlowChip Examples */}
        <GlowCard>
          <h2 className="text-2xl font-bold text-white mb-4">GlowChip</h2>
          <p className="text-gray-300 mb-6">Small capsules for stats, badges, and labels</p>
          
          <div className="flex flex-wrap gap-4">
            <GlowChip showDot>45 Events</GlowChip>
            <GlowChip showDot>199 Nodes</GlowChip>
            <GlowChip showDot>1 Quest</GlowChip>
            <GlowChip>Active</GlowChip>
            <GlowChip>Completed</GlowChip>
            <GlowChip onClick={() => alert('Clicked!')}>Clickable</GlowChip>
          </div>
        </GlowCard>

        {/* GlowButton Examples */}
        <GlowCard>
          <h2 className="text-2xl font-bold text-white mb-4">GlowButton</h2>
          <p className="text-gray-300 mb-6">Interactive buttons with primary and secondary variants</p>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="primary">Join Quest</GlowButton>
              <GlowButton variant="primary" showDot>Live Now</GlowButton>
              <GlowButton variant="primary" disabled>Disabled</GlowButton>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="secondary">View Details</GlowButton>
              <GlowButton variant="secondary" showDot>Active</GlowButton>
              <GlowButton variant="secondary" disabled>Disabled</GlowButton>
            </div>
          </div>
        </GlowCard>

        {/* GlowCard Examples */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">GlowCard</h2>
          <p className="text-gray-300 mb-6">Larger surfaces for overlays and content containers</p>
          
          <GlowCard>
            <h3 className="text-xl font-bold text-white mb-2">Standard Card</h3>
            <p className="text-gray-300">This is a standard card with no hover effect.</p>
          </GlowCard>

          <GlowCard hoverable>
            <h3 className="text-xl font-bold text-white mb-2">Hoverable Card</h3>
            <p className="text-gray-300">Hover over this card to see the lift effect.</p>
          </GlowCard>

          <GlowCard onClick={() => alert('Card clicked!')}>
            <h3 className="text-xl font-bold text-white mb-2">Clickable Card</h3>
            <p className="text-gray-300">This card is interactive and can be clicked.</p>
          </GlowCard>
        </div>

        {/* Combined Example */}
        <GlowCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Quest: Twitter Follow</h3>
              <GlowChip showDot>Active</GlowChip>
            </div>
            
            <p className="text-gray-300">
              Follow @ZoHouse on Twitter to earn 420 $ZO tokens.
            </p>
            
            <div className="flex items-center gap-4">
              <GlowChip>420 $ZO</GlowChip>
              <GlowChip>12 Completions</GlowChip>
            </div>
            
            <div className="flex gap-3">
              <GlowButton variant="primary">Join Quest</GlowButton>
              <GlowButton variant="secondary">View Leaderboard</GlowButton>
            </div>
          </div>
        </GlowCard>

        {/* Design Tokens Reference */}
        <GlowCard>
          <h2 className="text-2xl font-bold text-white mb-4">Design Tokens</h2>
          <div className="space-y-2 text-sm font-mono text-gray-300">
            <div>--glow-chip-bg: rgba(255, 255, 255, 0.20)</div>
            <div>--glow-chip-border: rgba(255, 255, 255, 0.40)</div>
            <div>--glow-chip-text: #ff4d6d</div>
            <div>--glow-chip-dot: #ff4d6d</div>
            <div>--glow-chip-dot-shadow: 0 0 10px rgba(255, 77, 109, 0.6)</div>
          </div>
        </GlowCard>

      </div>
    </div>
  );
};

export default GlowUIDemo;

