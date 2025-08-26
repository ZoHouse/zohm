'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import ProfileOverlay from './ProfileOverlay'; // Import ProfileOverlay

interface QuantumSyncOverlayProps {
  isVisible: boolean;
  onOpenDashboard: () => void;
}

const QuantumSyncOverlay: React.FC<QuantumSyncOverlayProps> = ({ isVisible, onOpenDashboard }) => {
  const { isConnected } = useWallet();

  if (!isVisible) return null;

  // If connected, show the profile. Otherwise, the profile overlay will handle the connection prompt.
  if (isConnected) {
    return <ProfileOverlay isVisible={true} onClose={() => {}} />;
  }

  // This part will be handled by the ProfileOverlay now.
  return null;
};

export default QuantumSyncOverlay;
