'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';
import PortalAnimation from './PortalAnimation';

interface NewOnboardingProps {
  isVisible: boolean;
  onComplete: (location: { lat: number; lng: number }) => void;
}

// All 14 unicorn avatars from Figma
const AVATAR_OPTIONS = [
  '/figma-assets/unicorn-avatar-1.png',
  '/figma-assets/unicorn-avatar-2.png',
  '/figma-assets/unicorn-avatar-3.png',
  '/figma-assets/unicorn-avatar-4.png',
  '/figma-assets/unicorn-avatar-5.png',
  '/figma-assets/unicorn-avatar-6.png',
  '/figma-assets/unicorn-avatar-7.png',
  '/figma-assets/unicorn-avatar-8.png',
  '/figma-assets/unicorn-avatar-9.png',
  '/figma-assets/unicorn-avatar-10.png',
  '/figma-assets/unicorn-avatar-11.png',
  '/figma-assets/unicorn-avatar-12.png',
  '/figma-assets/unicorn-avatar-13.png',
  '/figma-assets/unicorn-avatar-14.png'
];

const NewOnboarding: React.FC<NewOnboardingProps> = ({ isVisible, onComplete }) => {
  const { user: privyUser, authenticated: privyAuthenticated, linkTwitter } = usePrivy();

  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRequestingLocation, setIsRequestingLocation] = useState(true);
  const [showVoiceAuth, setShowVoiceAuth] = useState(false);

  // Check if X is connected
  const xAccount = privyUser?.linkedAccounts?.find(acc => acc.type === 'twitter_oauth');
  const isXConnected = !!xAccount;

  // Auto-request location on mount
  useEffect(() => {
    if (navigator.geolocation && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsRequestingLocation(false);
          console.log('📍 Location obtained:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Location error:', error);
          // Default to San Francisco
          setLocation({ lat: 37.7749, lng: -122.4194 });
          setIsRequestingLocation(false);
          console.log('📍 Using default location (SF)');
        }
      );
    }
  }, []);

  if (!isVisible || !privyAuthenticated || !privyUser) return null;

  // If voice auth screen should show, pass control to it
  if (showVoiceAuth) {
    return (
      <VoiceAuthScreen
        onComplete={() => {
          if (location) {
            onComplete(location);
          }
        }}
      />
    );
  }

  const handleConnectX = async () => {
    try {
      await linkTwitter();
      console.log('✅ X connected successfully');
    } catch (error) {
      console.error('Failed to connect X:', error);
      setError('Failed to connect X. You can continue anyway.');
    }
  };

  const handleSubmit = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || trimmedUsername.length < 2 || trimmedUsername.length > 12) {
      setError('Username must be 2-12 characters');
      return;
    }

    if (!location) {
      setError('Please allow location access or wait for default location');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await upsertUserFromPrivy(privyUser, {
        name: trimmedUsername,
        pfp: AVATAR_OPTIONS[selectedAvatar],
        lat: location.lat,
        lng: location.lng,
        onboarding_completed: true,
        role: 'Member'
      });

      // Store location for immediate map access
      if (typeof window !== 'undefined') {
        window.userLocationCoords = { lat: location.lat, lng: location.lng };
      }

      console.log('✅ Profile saved, proceeding to Voice Auth');
      
      // Proceed to Voice Auth screen
      setShowVoiceAuth(true);
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="figma-onboarding">
      {/* Video Background - same as landing page */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="figma-onboarding__bg-video"
      >
        <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
      </video>
      <div className="figma-onboarding__bg-gradient" />
      
      {/* Status Bar with real Figma assets */}
      <div className="figma-onboarding__status-bar">
        <span className="figma-onboarding__time">4:20</span>
        <div className="figma-onboarding__status-icons">
          <img src="/figma-assets/status-wifi.png" alt="" />
          <img src="/figma-assets/status-signal.png" alt="" />
          <img src="/figma-assets/status-battery.png" alt="" />
        </div>
      </div>
      
      {/* Zo Logo - Real Figma asset */}
      <img 
        src="/figma-assets/onboarding-zo-logo.png" 
        alt="Zo" 
        className="figma-onboarding__logo" 
      />
      
      {/* Home Indicator - Real Figma asset */}
      <img 
        src="/figma-assets/home-indicator.png" 
        alt="" 
        className="figma-onboarding__home-indicator" 
      />
      
      {/* Main Content */}
      <div className="figma-onboarding__container">
        {/* Title */}
        <h1 className="figma-onboarding__title">WHO ARE YOU?</h1>
        
        {/* Subtitle */}
        <p className="figma-onboarding__subtitle">
          A difficult question, I know. We'll get to it.<br />
          But let's start with choosing a nick.
        </p>

        {/* Username Input */}
        <div className="figma-onboarding__input-wrapper">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ishaan"
            maxLength={12}
            className="figma-onboarding__input"
            autoFocus
          />
        </div>

        {/* Avatar Selector - Now showing 2 at a time like Figma */}
        <div className="figma-onboarding__avatars">
          {AVATAR_OPTIONS.slice(0, 2).map((avatar, index) => (
            <div
              key={index}
              className={`figma-onboarding__avatar ${selectedAvatar === index ? 'selected' : ''}`}
              onClick={() => setSelectedAvatar(index)}
            >
              <img src={avatar} alt={`Avatar ${index + 1}`} />
            </div>
          ))}
        </div>

        {/* X Connect Button / Status */}
        {!isXConnected ? (
          <button 
            onClick={handleConnectX} 
            className="figma-onboarding__connect-x"
            type="button"
          >
            <img src="/figma-assets/wallet-icon-rect.png" alt="" className="figma-onboarding__x-icon" />
            Connect X (Twitter)
          </button>
        ) : (
          <div className="figma-onboarding__x-status">
            ✓ X Connected
            {xAccount && (xAccount as any).username && (
              <span className="figma-onboarding__x-username">
                @{(xAccount as any).username}
              </span>
            )}
          </div>
        )}

        {/* Location Status */}
        {isRequestingLocation && (
          <p className="figma-onboarding__location-text">📍 Getting your location...</p>
        )}
        {!isRequestingLocation && location && (
          <p className="figma-onboarding__location-ready">✓ Location ready</p>
        )}

        {/* Error Message */}
        {error && <p className="figma-onboarding__error">{error}</p>}

        {/* Get Citizenship Button - Real Figma asset */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !location || !username.trim()}
          className="figma-onboarding__submit"
          type="button"
        >
          <img 
            src="/figma-assets/get-citizenship-button.png" 
            alt="Get Citizenship" 
            className="figma-onboarding__submit-image"
          />
          <span className="figma-onboarding__submit-text">
            {isLoading ? 'Saving...' : 'Get Citizenship'}
          </span>
        </button>
      </div>

      {/* Keyboard with real Figma assets */}
      <div className="figma-onboarding__keyboard">
        <div className="figma-onboarding__keyboard-toolbar">
          <img src="/figma-assets/keyboard-arrow-left.png" alt="" />
          <img src="/figma-assets/keyboard-sticker.png" alt="" />
          <img src="/figma-assets/keyboard-gif.png" alt="" />
          <img src="/figma-assets/keyboard-paste.png" alt="" />
          <img src="/figma-assets/keyboard-settings.png" alt="" />
          <img src="/figma-assets/keyboard-more.png" alt="" />
          <img src="/figma-assets/keyboard-voice.png" alt="" />
        </div>
        <div className="figma-onboarding__keyboard-dismiss">
          <img src="/figma-assets/icon-arrow-down.png" alt="" />
        </div>
      </div>
    </div>
  );
};

// Voice Auth Screen Component
const VoiceAuthScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognized, setRecognized] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showPortalAnimation, setShowPortalAnimation] = useState(false);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice recognition not supported in this browser');
    }
  }, []);

  const handleStartListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      console.log('🎤 Listening...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Recognized:', transcript);

      // Check if "zo zo zo" was said
      const zoCount = (transcript.match(/zo/g) || []).length;
      
      if (zoCount >= 3 || transcript.includes('zo zo zo')) {
        console.log('✅ Voice auth successful!');
        setRecognized(true);
        // Show portal animation after 1 second
        setTimeout(() => {
          setShowPortalAnimation(true);
        }, 1000);
      } else {
        setError(`Heard: "${transcript}". Try saying "Zo Zo Zo"`);
        setAttempts(prev => prev + 1);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError('Could not recognize. Tap to try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSkip = () => {
    console.log('⏭️ Skipped voice auth');
    // Show portal animation even on skip
    setShowPortalAnimation(true);
  };

  // If portal animation should show, render it
  if (showPortalAnimation) {
    return <PortalAnimation onComplete={onComplete} />;
  }

  // Determine which state assets to use
  const getStateAssets = () => {
    if (recognized) {
      return {
        bg: '/figma-assets/voice-bg-success-1.png',
        title: '/figma-assets/quantum-title-success.png',
        avatar: '/figma-assets/voice-avatar-success.png',
        coins: [
          '/figma-assets/coin-success-1.png',
          '/figma-assets/coin-success-2.png',
          '/figma-assets/coin-success-3.png',
          '/figma-assets/coin-success-4.png',
          '/figma-assets/coin-success-5.png'
        ],
        platform: '/figma-assets/voice-platform.png',
        status: {
          wifi: '/figma-assets/voice-status-wifi-success.png',
          signal: '/figma-assets/voice-status-signal-success.png',
          battery: '/figma-assets/voice-status-battery-success.png'
        }
      };
    } else if (error && attempts >= 1) {
      return {
        bg: '/figma-assets/voice-bg-fail.png',
        title: '/figma-assets/quantum-title-fail.png',
        avatar: '/figma-assets/voice-avatar-fail.png',
        coins: [
          '/figma-assets/coin-fail-1.png',
          '/figma-assets/coin-fail-2.png',
          '/figma-assets/coin-fail-3.png',
          '/figma-assets/coin-fail-4.png'
        ],
        platform: '/figma-assets/voice-platform.png',
        status: {
          wifi: '/figma-assets/voice-status-wifi-fail.png',
          signal: '/figma-assets/voice-status-signal-fail.png',
          battery: '/figma-assets/voice-status-battery-fail.png'
        }
      };
    } else if (isListening) {
      return {
        bg: '/figma-assets/voice-bg-pressed.png',
        title: '/figma-assets/quantum-sync-title.png',
        avatar: '/figma-assets/voice-avatar-pressed.png',
        coins: [
          '/figma-assets/coin-pressed-1.png',
          '/figma-assets/coin-pressed-2.png',
          '/figma-assets/coin-pressed-3.png',
          '/figma-assets/coin-pressed-4.png',
          '/figma-assets/coin-pressed-5.png'
        ],
        platform: '/figma-assets/voice-platform.png',
        status: {
          wifi: '/figma-assets/status-wifi-pressed.png',
          signal: '/figma-assets/status-signal-pressed.png',
          battery: '/figma-assets/status-battery-pressed.png'
        }
      };
    } else {
      return {
        bg: '/figma-assets/voice-default-bg.png',
        title: '/figma-assets/quantum-sync-title.png',
        avatar: '/figma-assets/voice-default-avatar.png',
        coins: [
          '/figma-assets/voice-default-coin-1.png',
          '/figma-assets/voice-default-coin-2.png',
          '/figma-assets/voice-default-coin-3.png',
          '/figma-assets/voice-default-coin-4.png',
          '/figma-assets/voice-default-coin-5.png'
        ],
        platform: '/figma-assets/voice-platform.png',
        status: {
          wifi: '/figma-assets/voice-status-wifi.png',
          signal: '/figma-assets/voice-status-signal.png',
          battery: '/figma-assets/voice-status-battery.png'
        }
      };
    }
  };

  const assets = getStateAssets();

  return (
    <div className="voice-auth-screen" style={{ backgroundImage: `url(${assets.bg})` }}>
      {/* Status Bar with state-specific assets */}
      <div className="voice-auth-screen__status-bar">
        <span className="voice-auth-screen__time">4:20</span>
        <div className="voice-auth-screen__status-icons">
          <img src={assets.status.wifi} alt="" />
          <img src={assets.status.signal} alt="" />
          <img src={assets.status.battery} alt="" />
        </div>
      </div>
      
      {/* Zo Logo - Real Figma asset */}
      <img 
        src="/figma-assets/voice-zo-logo.png" 
        alt="Zo" 
        className="voice-auth-screen__logo" 
      />

      {/* Main Content */}
      <div className="voice-auth-screen__container">
        {/* QUANTUM SYNC Title - Real Figma Asset with state */}
        <div className="voice-auth-screen__title-wrapper">
          <img 
            src={assets.title} 
            alt="QUANTUM SYNC" 
            className="voice-auth-screen__title-image" 
          />
        </div>

        <p className="voice-auth-screen__subtitle">
          Zo World is a reality,<br />
          you tune in with the sound Zo
        </p>

        {/* Microphone Visualization with Platform and Coins */}
        <div className="voice-auth-screen__mic-area">
          {/* Floating Coins */}
          <div className="voice-auth-screen__coins">
            {assets.coins.map((coin, index) => (
              <img 
                key={index}
                src={coin} 
                alt="" 
                className={`voice-auth-screen__coin voice-auth-screen__coin-${index + 1}`}
              />
            ))}
          </div>

          {/* Avatar/Microphone with Video Animation */}
          <div 
            className={`voice-auth-screen__mic ${isListening ? 'listening' : ''} ${recognized ? 'recognized' : ''}`}
            onClick={handleStartListening}
          >
            {isListening ? (
              <video 
                src="/videos/mic-recording.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="voice-auth-screen__mic-video"
              />
            ) : (
              <img 
                src={assets.avatar} 
                alt="Microphone" 
                className="voice-auth-screen__mic-image" 
              />
            )}
          </div>
          
          {/* Stone Platform */}
          <img 
            src={assets.platform} 
            alt="" 
            className="voice-auth-screen__platform" 
          />
        </div>

        {/* Instruction */}
        <p className="voice-auth-screen__instruction">
          {recognized ? '✓ PREPARING ZO WORLD!' : isListening ? '🎤 LISTENING...' : "Tap & say 'Zo Zo Zo'"}
        </p>

        {/* Error Message */}
        {error && <p className="voice-auth-screen__error">{error}</p>}

        {/* Skip Button */}
        {attempts >= 2 && (
          <button 
            onClick={handleSkip}
            className="voice-auth-screen__skip"
            type="button"
          >
            Skip Voice Auth
          </button>
        )}
      </div>

      {/* Home Indicator */}
      <img 
        src="/figma-assets/home-indicator.png" 
        alt="" 
        className="voice-auth-screen__home-indicator" 
      />
    </div>
  );
};

export default NewOnboarding;
