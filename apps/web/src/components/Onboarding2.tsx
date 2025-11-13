'use client';

import { useState, useEffect } from 'react';
import NicknameStep from './NicknameStep';
import AvatarStep from './AvatarStep';
import CitizenCard from './CitizenCard';
import PortalAnimation from './PortalAnimation';

interface OnboardingProps {
  onComplete: () => void;
  userId?: string;
}

/**
 * Onboarding2 - Orchestrator Component
 * 
 * This component manages the 4-step onboarding flow:
 * 1. NicknameStep: User enters nickname and selects gender
 * 2. AvatarStep: User selects their avatar/PFP
 * 3. CitizenCard: Welcome screen with "Quantum Sync" button
 * 4. PortalAnimation: Magical transition animation (opening disks + stone portal)
 * 
 * Correct flow: Nickname → Avatar → CitizenCard → Portal → Voice Quest
 */
export default function Onboarding2({ onComplete, userId }: OnboardingProps) {
  const [step, setStep] = useState('nickname'); // nickname, avatar, card, portal

  // Handlers to move between steps
  const handleNicknameComplete = () => setStep('avatar');
  const handleAvatarComplete = () => setStep('card');
  const handleCardComplete = () => setStep('portal'); // Show portal animation after quantum sync
  const handlePortalComplete = () => onComplete(); // Go to voice quest after portal

  switch (step) {
    case 'nickname':
      return <NicknameStep onNicknameSet={handleNicknameComplete} />;
    case 'avatar':
      return <AvatarStep onAvatarSet={handleAvatarComplete} />;
    case 'card':
      return <CitizenCard onboardingStep={step} userId={userId} onComplete={handleCardComplete} />;
    case 'portal':
      return <PortalAnimation onComplete={handlePortalComplete} />;
    default:
      return <NicknameStep onNicknameSet={handleNicknameComplete} />;
  }
}

