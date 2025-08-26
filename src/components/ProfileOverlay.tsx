'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useProfileGate } from '@/hooks/useProfileGate';
import ProfileSetup from './ProfileSetup';
import NFTGallery from './NFTGallery';
import { NFTData } from '@/lib/nftFetcher';

interface ProfileOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const ProfileOverlay: React.FC<ProfileOverlayProps> = ({ isVisible, onClose }) => {
  const { isConnected, address, role, formatAddress, quantumSync, isLoading } = useWallet();
  const [showNFTGallery, setShowNFTGallery] = useState(false);
  const profileGate = useProfileGate();
  const { memberProfile, isProfileComplete, isLoadingProfile, showProfileSetup, setShowProfileSetup } = profileGate;

  const handleQuantumSync = async () => {
    const success = await quantumSync();
    if (success) {
      await profileGate.loadMemberProfile();
    }
  };

  const handleProfileSetupComplete = () => {
    profileGate.completeProfileSetup();
  };

  const handleNFTSelection = async (nft: NFTData) => {
    // This function will be implemented later
  };

  if (!isVisible) return null;

  if (showNFTGallery && isConnected && address) {
    return (
      <NFTGallery
        isVisible={showNFTGallery}
        walletAddress={address}
        onSelectNFT={handleNFTSelection}
        onClose={() => setShowNFTGallery(false)}
        currentPFP={memberProfile?.pfp}
      />
    );
  }

  if (showProfileSetup && isConnected && address) {
    return (
      <ProfileSetup
        isVisible={showProfileSetup}
        walletAddress={address}
        onComplete={handleProfileSetupComplete}
        onClose={() => setShowProfileSetup(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-20" onClick={onClose} />
      <div className="paper-overlay relative w-full max-w-sm">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl">&times;</button>
        
        {isConnected ? (
          <>
            <div className="paper-profile-header">
              <img 
                src={memberProfile?.pfp || '/default-avatar.png'} 
                alt="Profile" 
                className="paper-avatar"
              />
              <h2 className="text-2xl font-bold">{memberProfile?.name || 'Unnamed User'}</h2>
              <p className="text-sm">{address ? formatAddress(address) : ''}</p>
            </div>

            {isProfileComplete ? (
              <>
                <div className="paper-profile-body">
                  <h3 className="font-bold mb-2">Bio</h3>
                  <p className="text-sm">{memberProfile?.bio}</p>
                </div>
                <div className="paper-profile-body">
                  <h3 className="font-bold mb-2">Culture</h3>
                  <p className="text-sm">{memberProfile?.culture}</p>
                </div>
                <button onClick={() => setShowProfileSetup(true)} className="paper-button w-full mt-4">Edit Profile</button>
              </>
            ) : (
              <div className="text-center">
                <p className="mb-4">Complete your profile to get started</p>
                <button onClick={() => setShowProfileSetup(true)} className="paper-button">Complete Profile</button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4">Connect your wallet to get started</p>
            <button onClick={handleQuantumSync} disabled={isLoading} className="paper-button">
              {isLoading ? 'Connecting...' : 'Quantum Sync'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOverlay;
