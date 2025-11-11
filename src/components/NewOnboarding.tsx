'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';
import './NewOnboarding.css';

interface NewOnboardingProps {
  isVisible: boolean;
  onComplete: (location: { lat: number; lng: number }) => void;
}

const AVATAR_OPTIONS = [
  '/unicorn images/UnicornMemes_v1-01.png',
  '/unicorn images/UnicornMemes_v1-02.png',
  '/unicorn images/UnicornMemes_v1-03.png',
  '/unicorn images/UnicornMemes_v1-04.png',
  '/unicorn images/UnicornMemes_v1-05.png',
  '/unicorn images/UnicornMemes_v1-06.png',
  '/unicorn images/UnicornMemes_v1-07.png',
  '/unicorn images/Unicorn_Crying.png',
  '/unicorn images/Unicorn_Rainbow.png',
  '/unicorn images/UnicornCool.png',
  '/unicorn images/UnicornMagnifyingGlass.png',
  '/unicorn images/UnicornMemes_poppedeye.png',
  '/unicorn images/UnicornRainbowPuke.png',
  '/unicorn images/UnicornRocket.png'
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
    <div className="new-onboarding">
      {/* Background */}
      <div className="new-onboarding__background" />
      
      {/* Zo Logo */}
      <img 
        src="/Zo_flexing_white.png" 
        alt="Zo" 
        className="new-onboarding__logo" 
      />
      
      {/* Content */}
      <div className="new-onboarding__content">
        {/* Title */}
        <h1 className="new-onboarding__title">WHO ARE YOU?</h1>
        
        {/* Subtitle */}
        <p className="new-onboarding__subtitle">
          A difficult question, I know. We'll get to it.
          <br />
          But let's start with choosing a nick.
        </p>

        {/* Username Input */}
        <div className="new-onboarding__input-container">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ishaan"
            maxLength={12}
            className="new-onboarding__username-input"
            autoFocus
          />
        </div>

        {/* Avatar Selector */}
        <div className="new-onboarding__avatar-selector">
          <div className="new-onboarding__avatar-grid">
            {AVATAR_OPTIONS.map((avatar, index) => (
              <div
                key={index}
                className={`new-onboarding__avatar ${selectedAvatar === index ? 'selected' : ''}`}
                onClick={() => setSelectedAvatar(index)}
              >
                <img src={avatar} alt={`Avatar ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* X Connect Button */}
        {!isXConnected ? (
          <button 
            onClick={handleConnectX} 
            className="new-onboarding__x-connect"
            type="button"
          >
            Connect X (Twitter)
          </button>
        ) : (
          <div className="new-onboarding__x-connected">
            ✓ X Connected
            {xAccount && (xAccount as any).username && (
              <span className="new-onboarding__x-username">
                @{(xAccount as any).username}
              </span>
            )}
          </div>
        )}

        {/* Location Status */}
        {isRequestingLocation && (
          <p className="new-onboarding__location-status">
            📍 Getting your location...
          </p>
        )}
        {!isRequestingLocation && location && (
          <p className="new-onboarding__location-ready">
            ✓ Location ready
          </p>
        )}

        {/* Error Message */}
        {error && <p className="new-onboarding__error">{error}</p>}

        {/* Get Citizenship Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !location || !username.trim()}
          className="new-onboarding__submit-btn"
          type="button"
        >
          {isLoading ? 'Saving...' : 'Get Citizenship'}
        </button>
      </div>
    </div>
  );
};

// Voice Auth Screen Component (inline for now)
const VoiceAuthScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognized, setRecognized] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

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
        setTimeout(() => {
          onComplete();
        }, 1500);
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
    onComplete();
  };

  return (
    <div className="voice-auth">
      {/* Background */}
      <div className="voice-auth__background" />
      
      {/* Logo */}
      <img 
        src="/Zo_flexing_white.png" 
        alt="Zo" 
        className="voice-auth__logo" 
      />

      {/* Content */}
      <div className="voice-auth__content">
        {/* Title */}
        <div className="voice-auth__title-container">
          <h1 className="voice-auth__title">QUANTUM</h1>
          <h1 className="voice-auth__title">SYNC</h1>
        </div>

        <p className="voice-auth__subtitle">
          Zo World is a reality,
          <br />
          you tune in with the sound Zo
        </p>

        {/* Microphone Visualization */}
        <div 
          className={`voice-auth__microphone ${isListening ? 'listening' : ''} ${recognized ? 'recognized' : ''}`}
          onClick={handleStartListening}
        >
          <div className="voice-auth__mic-icon">🎤</div>
          <div className="voice-auth__ring voice-auth__ring--1"></div>
          <div className="voice-auth__ring voice-auth__ring--2"></div>
          <div className="voice-auth__ring voice-auth__ring--3"></div>
        </div>

        {/* Instruction */}
        <p className="voice-auth__instruction">
          {recognized ? '✓ Success!' : "Tap & say 'Zo Zo Zo'"}
        </p>

        {/* Error Message */}
        {error && <p className="voice-auth__error">{error}</p>}

        {/* Skip Button */}
        {attempts >= 2 && (
          <button 
            onClick={handleSkip}
            className="voice-auth__skip-btn"
            type="button"
          >
            Skip Voice Auth
          </button>
        )}
      </div>
    </div>
  );
};

export default NewOnboarding;

