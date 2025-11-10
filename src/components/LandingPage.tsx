'use client';

import { useEffect, useRef } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onConnect: () => void;
}

export default function LandingPage({ onConnect }: LandingPageProps) {
  const starfieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate stars dynamically
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000]" style={{ backgroundColor: '#121212' }}>
      <div 
        ref={starfieldRef}
        className="absolute inset-0 z-0"
        style={{ pointerEvents: 'none' }}
      />
      
      <div className="grid-floor" />
      
      <div className="text-center text-white max-w-lg mx-auto px-4 relative z-10" style={{ marginTop: '-60vh' }}>
        <button 
          onClick={onConnect}
          className="red-pill-button"
          type="button"
        >
          Take the Red Pill
        </button>
      </div>
      
      <div className="absolute left-0 right-0 flex justify-center z-10" style={{ bottom: '20%', transform: 'translateY(-20px)' }}>
        <div className="relative" style={{ display: 'inline-block' }}>
          <img 
            src="/objects.svg" 
            alt="Objects" 
            className="mx-auto"
            style={{ display: 'block' }}
          />
          <img 
            src="/Bro.svg" 
            alt="Bro" 
            className="absolute landing-character"
            style={{ 
              bottom: '0',
              left: '50%', 
              transform: 'translateX(-50%)',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}

