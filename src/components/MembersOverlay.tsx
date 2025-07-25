'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useProfileGate } from '@/hooks/useProfileGate';
import { getAllMembers, Member } from '@/lib/supabase';
import ProfileSetup from './ProfileSetup';

interface MembersOverlayProps {
  isVisible: boolean;
  openProfile?: () => void;
}

// Move mockMembers outside component to prevent recreation on every render
const mockMembers: Member[] = [
  { wallet: "0x1234...5678", name: "Alex Chen", role: "Founder", lat: 37.7749, lng: -122.4194, last_seen: "2025-01-01T00:00:00.000Z" },
  { wallet: "0x2345...6789", name: "Priya Sharma", role: "Founder", lat: 12.9716, lng: 77.5946, last_seen: "2025-01-01T00:00:00.000Z" },
  { wallet: "0x3456...7890", name: "Marcus Johnson", role: "Founder", lat: 37.7849, lng: -122.4094, last_seen: "2025-01-01T00:00:00.000Z" }
];

const MembersOverlay: React.FC<MembersOverlayProps> = ({ isVisible, openProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocation, setActiveLocation] = useState('all');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [supabaseMembers, setSupabaseMembers] = useState<Member[]>([]);
  
  const wallet = useWallet();
  const profileGate = useProfileGate();

  useEffect(() => {
    const loadMembers = async () => {
      const members = await getAllMembers();
      if (members && members.length > 0) setSupabaseMembers(members);
    };
    if (isVisible) loadMembers();
  }, [isVisible]);

  // Memoize allMembers to prevent unnecessary re-renders
  const allMembers = useMemo(() => {
    return supabaseMembers.length > 0 ? supabaseMembers : mockMembers;
  }, [supabaseMembers]);

  useEffect(() => {
    let filtered = allMembers;
    if (activeLocation !== 'all') {
      filtered = filtered.filter(member => {
        const lat = member.lat || member.latitude || 0;
        const lng = member.lng || member.longitude || 0;
        if (activeLocation === 'bangalore') return lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8;
        if (activeLocation === 'sanfrancisco') return lat >= 37.7 && lat <= 37.8 && lng >= -122.5 && lng <= -122.3;
        return true;
      });
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(m => (m.name || '').toLowerCase().includes(lower) || (m.role || '').toLowerCase().includes(lower) || (m.wallet || '').toLowerCase().includes(lower));
    }
    setFilteredMembers(filtered);
  }, [allMembers, searchTerm, activeLocation]);

  const getLocationName = (lat?: number, lng?: number) => {
    if (!lat || !lng) return 'Unknown';
    if (lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8) return 'Bangalore';
    if (lat >= 37.7 && lat <= 37.8 && lng >= -122.5 && lng <= -122.3) return 'San Francisco';
    return 'Remote';
  };

  const getStatus = (lastSeen?: string) => {
    if (!lastSeen) return { key: 'offline', text: 'Offline', color: 'bg-gray-400' };
    const diff = (new Date().getTime() - new Date(lastSeen).getTime()) / 60000;
    if (diff < 5) return { key: 'online', text: 'Online', color: 'bg-green-500' };
    if (diff < 30) return { key: 'busy', text: 'Recently Active', color: 'bg-yellow-500' };
    return { key: 'offline', text: 'Offline', color: 'bg-gray-400' };
  };

  const handleQuantumSync = async () => {
    const success = await wallet.quantumSync();
    if (success && openProfile) {
      // Don't auto-open profile, just complete the sync
      console.log('✅ Quantum sync completed for Members access');
    }
  };

  if (!isVisible) return null;

  // Show Profile Setup if needed
  if (profileGate.showProfileSetup && wallet.isConnected && wallet.address) {
    return (
      <ProfileSetup
        isVisible={profileGate.showProfileSetup}
        walletAddress={wallet.address}
        onComplete={profileGate.completeProfileSetup}
        onClose={() => profileGate.setShowProfileSetup(false)}
      />
    );
  }

  // Gated Access: Show connection/verification screen if not a Founder
  if (!wallet.isConnected || wallet.role !== 'Founder') {
    return (
      <>
        {/* Desktop Gate */}
        <div className="hidden md:flex fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col liquid-glass-pane p-0">
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">👑</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Founders Only</h3>
              <p className="text-gray-300 text-sm mb-4">
                Members directory is exclusive to Zo House Founders
              </p>
            </div>

            {!wallet.isConnected ? (
              <div className="space-y-4 w-full">
                <p className="text-gray-400 text-sm">Connect your wallet to verify Founder NFT</p>
                <button 
                  onClick={handleQuantumSync}
                  disabled={wallet.isLoading}
                  className="solid-button w-full py-3"
                >
                  {wallet.isLoading ? '🔄 Verifying...' : '🧬 Quantum Sync'}
                </button>
                {wallet.error && (
                  <div className="text-red-400 text-xs bg-red-900/50 p-2 rounded-lg">
                    {wallet.error}
                  </div>
                )}
              </div>
            ) : wallet.role !== 'Founder' ? (
              <div className="space-y-4 w-full">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Connected as:</p>
                  <p className="font-mono text-xs text-gray-400">{wallet.formatAddress(wallet.address!)}</p>
                  <p className="text-yellow-400 text-sm mt-1">Role: {wallet.role}</p>
                </div>
                                  <p className="text-gray-400 text-sm">
                    You need a Zo House Founder NFT to access the members directory
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://zo.xyz/membership"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="solid-button text-center py-2 text-sm"
                    >
                      🎯 Get One
                    </a>
                    <div className="flex gap-2">
                      <button
                        onClick={wallet.disconnectWallet}
                        className="glass-icon-button flex-1 py-2 text-sm"
                      >
                        Disconnect
                      </button>
                      <button
                        onClick={handleQuantumSync}
                        className="solid-button flex-1 py-2 text-sm"
                      >
                        Re-verify
                      </button>
                    </div>
                  </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Gate */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[240px] z-100 flex flex-col liquid-glass-pane rounded-t-2xl rounded-b-none">
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                <span className="text-2xl">👑</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Founders Only</h3>
              <p className="text-gray-300 text-xs mb-3">
                Exclusive to Zo House Founders
              </p>
            </div>

            {!wallet.isConnected ? (
              <button 
                onClick={handleQuantumSync}
                disabled={wallet.isLoading}
                className="solid-button px-6 py-2 text-sm"
              >
                {wallet.isLoading ? '🔄 Verifying...' : '🧬 Quantum Sync'}
              </button>
                          ) : wallet.role !== 'Founder' ? (
                <div className="space-y-2">
                  <p className="text-yellow-400 text-sm">Role: {wallet.role}</p>
                  <p className="text-gray-400 text-xs">Need Founder NFT</p>
                  <div className="flex gap-2">
                    <a
                      href="https://zo.xyz/membership"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="solid-button px-3 py-2 text-sm"
                    >
                      🎯 Get One
                    </a>
                    <button
                      onClick={handleQuantumSync}
                      className="solid-button px-3 py-2 text-sm"
                    >
                      Re-verify
                    </button>
                  </div>
                </div>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  // For Founders, check profile completion before showing members
  if (wallet.isConnected && wallet.role === 'Founder' && !profileGate.isLoadingProfile) {
    // Only check profile access if we're not already showing the setup
    if (!profileGate.showProfileSetup && !profileGate.isProfileComplete) {
      profileGate.checkProfileAccess();
    }
  }

  // Show loading state while profile is being checked
  if (wallet.isConnected && wallet.role === 'Founder' && profileGate.isLoadingProfile) {
    return (
      <div className="hidden md:flex fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col liquid-glass-pane p-0">
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-white">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderHeader = () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-center">
                {wallet.isConnected && wallet.address ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2">
              <div className="glass-icon-button px-4 py-2 font-semibold text-sm">🔗 {wallet.formatAddress(wallet.address)}</div>
              <button onClick={wallet.disconnectWallet} className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-red-600">✕</button>
            </div>
            
            {/* View Profile Button */}
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  if (openProfile) openProfile();
                }}
                className="glass-icon-button px-4 py-2 text-sm"
              >
                👤 View Profile
              </button>
            </div>


            </div>
        ) : (
          <button onClick={handleQuantumSync} disabled={wallet.isLoading} className="solid-button px-6 py-2 text-sm">
            {wallet.isLoading ? '🔄 Syncing...' : '🧬 Quantum Sync'}
          </button>
        )}
      </div>
      {wallet.error && <div className="text-red-400 text-xs text-center bg-red-900/50 p-2 rounded-lg">{wallet.error}</div>}
      <div className="flex gap-2 justify-center">
        {['all', 'bangalore', 'sanfrancisco'].map(loc => (
          <button key={loc} onClick={() => setActiveLocation(loc)} className={`glass-icon-button px-3 py-2 text-xs font-medium capitalize ${activeLocation === loc ? 'bg-white/20' : ''}`}>
            {loc.replace('sanfrancisco', 'San Francisco')}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input type="text" placeholder="Search members" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 px-3 py-2 border border-white/10 rounded-lg bg-black/30 text-white/80 placeholder-white/40 focus:outline-none focus:border-white/30" />
        <button className="glass-icon-button px-4 py-2 text-sm">Connect All</button>
      </div>
    </div>
  );

  const renderMemberList = (members: Member[]) => (
    <ul className="flex flex-col gap-3 list-none p-0 m-0">
      {members.map((member, index) => {
        const status = getStatus(member.last_seen);
        const location = getLocationName(member.lat || member.latitude, member.lng || member.longitude);
        return (
          <li key={index} className="liquid-glass-card p-3 flex gap-4 items-center">
            <div className="flex-shrink-0 relative">
              <div className="w-12 h-12 bg-purple-600/50 rounded-full flex items-center justify-center font-bold text-lg">
                {member.name ? member.name.split(' ').map(n => n[0]).join('') : member.wallet.slice(2, 4).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${status.color} rounded-full border-2 border-[#1C1C1E]`}></div>
            </div>
            <div className="flex-grow">
              <h3 className="text-base font-bold">{member.name || wallet.formatAddress(member.wallet)}</h3>
              <p className="text-sm text-white/70">👑 {member.role}</p>
              <p className="text-sm text-white/70">📍 {location}</p>
              <p className="text-xs text-white/50">{status.text}</p>
            </div>
            <button className="solid-button px-4 py-2 text-sm self-center">Connect</button>
          </li>
        );
      })}
    </ul>
  );

  const renderMobileMemberList = (members: Member[]) => (
     <div className="flex gap-3 h-full items-start">
      {members.map((member, index) => {
        const status = getStatus(member.last_seen);
        return (
          <div key={index} className="liquid-glass-card p-3 flex flex-col items-center text-center w-[140px] h-full flex-shrink-0">
            <div className="relative mb-2">
              <div className="w-16 h-16 bg-purple-600/50 rounded-full flex items-center justify-center font-bold text-xl">
                {member.name ? member.name.split(' ').map(n => n[0]).join('') : member.wallet.slice(2, 4).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${status.color} rounded-full border-2 border-[#1C1C1E]`}></div>
            </div>
            <h3 className="text-sm font-bold leading-tight line-clamp-2 w-full">{member.name || wallet.formatAddress(member.wallet)}</h3>
            <button className="solid-button px-4 py-1 text-xs mt-auto">Connect</button>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="hidden md:flex fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col liquid-glass-pane p-0">
        {renderHeader()}
        <div className="flex-1 overflow-y-auto px-4 pb-4">{renderMemberList(filteredMembers)}</div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[240px] z-100 flex flex-col liquid-glass-pane rounded-t-2xl rounded-b-none">
        {renderHeader()}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-2">
          {renderMobileMemberList(filteredMembers)}
        </div>
      </div>
    </>
  );
};

export default MembersOverlay; 