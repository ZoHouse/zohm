'use client';

import { useEffect, useRef, useState } from 'react';
import { getCityFromCoordinates } from '@/lib/geocoding';

interface OnboardingPageProps {
  onComplete: (answers: string[], location?: { lat: number; lng: number }) => void;
  onNavigateToHome: () => void;
  getAccessToken: () => Promise<string | null>;
}

const QUESTIONS = [
  "What is your name bro?",
  "What is your culture bro?",
  "Which city you from bro?"
];

const CITY_QUESTION_INDEX = 2;

export default function OnboardingPage({ onComplete, onNavigateToHome, getAccessToken }: OnboardingPageProps) {
  const starfieldRef = useRef<HTMLDivElement>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAtCenter, setIsAtCenter] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Generate stars dynamically (same as LandingPage)
    if (starfieldRef.current) {
      const starfield = starfieldRef.current;
      const starCount = 150; // Number of stars
      
      // Clear existing stars
      starfield.innerHTML = '';
      
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random size (small, medium, or large)
        const sizes = ['small', 'medium', 'large'];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        star.classList.add(size);
        
        // Random position
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Random animation delay for variety
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        starfield.appendChild(star);
      }
    }
  }, []);

  const handleLaunch = async () => {
    // Check if user exists when Launch App is clicked
    try {
      const token = await getAccessToken();
      
      if (token) {
        const response = await fetch('/api/user/check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.exists) {
          // User exists, go to home page
          onNavigateToHome();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }

    // User doesn't exist, start onboarding questions
    setIsLaunching(true);
    // Wait for astronaut to reach center (1.5 seconds)
    setTimeout(() => {
      setIsAtCenter(true);
    }, 1500);
  };

  const handleAnswer = (providedAnswer?: string) => {
    const currentAnswer = (providedAnswer || answer).trim();
    if (currentAnswer) {
      setIsAnswered(true);
      setAnswers(prev => [...prev, currentAnswer]);
      
      // Continue animation upward, then check if there are more questions
      setTimeout(() => {
        const nextQuestionIndex = currentQuestionIndex + 1;
        
        if (nextQuestionIndex >= QUESTIONS.length) {
          // All questions answered, complete onboarding with all answers and location
          console.log('Onboarding complete - Location coords:', locationCoords);
          onComplete([...answers, currentAnswer], locationCoords || undefined);
        } else {
          // Reset for next question - this will trigger a new astronaut to appear
          setCurrentQuestionIndex(nextQuestionIndex);
          setIsAtCenter(false);
          setIsAnswered(false);
          setAnswer('');
          setIsLocationLoading(false);
          setLocationError(null);
          
          // Wait for next astronaut to reach center (1.5 seconds)
          // The key prop will force React to recreate the component, restarting the animation
          setTimeout(() => {
            setIsAtCenter(true);
          }, 1500);
        }
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnswer();
    }
  };

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Store location coordinates
          const coords = { lat: latitude, lng: longitude };
          console.log('Location obtained:', coords);
          setLocationCoords(coords);
          
          const result = await getCityFromCoordinates(latitude, longitude);
          
          if (result.city) {
            const cityName = result.city;
            setAnswer(cityName);
            setIsLocationLoading(false);
            // Auto-submit after getting the city
            setTimeout(() => {
              handleAnswer(cityName);
            }, 500);
          } else {
            setLocationError(result.error || 'Could not determine city from location');
            setIsLocationLoading(false);
          }
        } catch (error) {
          console.error('Error getting city from coordinates:', error);
          setLocationError('Failed to get city name from location');
          setIsLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const isCityQuestion = currentQuestionIndex === CITY_QUESTION_INDEX;

  // Get the appropriate astronaut image based on question index
  const getAstronautImage = () => {
    switch (currentQuestionIndex) {
      case 0:
        return '/launch_astronaut.svg';
      case 1:
        return '/launch_astronaut2.svg';
      case 2:
        return '/launch_astronaut3.svg';
      default:
        return '/launch_astronaut.svg';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000]" style={{ backgroundColor: '#121212' }}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ pointerEvents: 'none' }}
      >
        <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
      </video>
      
      <div 
        ref={starfieldRef}
        className="absolute inset-0 z-0"
        style={{ pointerEvents: 'none' }}
      />
      
      <div className={`grid-floor ${isLaunching ? 'floor-move-down' : ''}`} />

      <div className={`landing-button-container ${isLaunching ? 'button-fade-out' : ''}`}>
        <button 
          className="red-pill-button"
          type="button"
          onClick={handleLaunch}
          disabled={isLaunching}
        >
          Launch App
        </button>
      </div>
      
      <div className={`landing-objects-container ${isLaunching ? 'objects-container-move-down' : ''}`}>
        <div className="landing-objects-wrapper">
          <img 
            src="/objects.svg" 
            alt="Objects" 
            className="landing-objects-svg"
          />
        </div>
      </div>
      
      {isLaunching ? (
        <>
          {currentQuestionIndex < QUESTIONS.length && (
            <div 
              key={currentQuestionIndex}
              className={`astronaut-with-question ${isAtCenter ? 'at-center' : ''} ${isAnswered ? 'answered' : ''}`}
            >
              <img 
                src={getAstronautImage()}
                alt="Astronaut" 
                className="landing-bro-svg astronaut-launch"
              />
              <div className="question-bubble">
                <div className="question-header">
                  <div className="question-number">
                    {currentQuestionIndex + 1} / {QUESTIONS.length}
                  </div>
                </div>
                <p className="question-text">{QUESTIONS[currentQuestionIndex]}</p>
                {isAtCenter && !isAnswered && (
                  <div className="answer-input-container">
                    {isCityQuestion ? (
                      <>
                        <button 
                          onClick={handleLocationRequest}
                          className="location-button"
                          disabled={isLocationLoading}
                        >
                          {isLocationLoading ? (
                            <>
                              <span className="location-spinner" />
                              <span className="button-text">Locating...</span>
                            </>
                          ) : (
                            <>
                              <span className="location-icon">📍</span>
                              <span className="button-text">Use My Location</span>
                            </>
                          )}
                          <span className="button-glow" />
                        </button>
                        {locationError && (
                          <div className="location-error">
                            {locationError}
                          </div>
                        )}
                        {answer && !isLocationLoading && (
                          <div className="location-result">
                            <span className="location-check">✓</span>
                            <span className="location-city">{answer}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="input-wrapper">
                          <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Zo Zo Zo"
                            className="answer-input"
                            autoFocus
                          />
                          <div className="input-glow" />
                        </div>
                        <button 
                          onClick={() => handleAnswer()}
                          className="answer-button"
                          disabled={!answer.trim()}
                        >
                          <span className="button-text">Submit</span>
                          <span className="button-glow" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <img 
          src="/astronaut.svg"
          alt="Astronaut" 
          className="landing-bro-svg"
        />
      )}
    </div>
  );
}

