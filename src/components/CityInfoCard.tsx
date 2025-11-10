'use client';

import { useState, useEffect } from 'react';

interface CityInfoCardProps {
  city: string;
}

// City timezone mapping
const CITY_TIMEZONES: { [key: string]: string } = {
  'San Francisco': 'America/Los_Angeles',
  'New York': 'America/New_York',
  'London': 'Europe/London',
  'Bangalore': 'Asia/Kolkata',
  'Bengaluru': 'Asia/Kolkata',
  'Singapore': 'Asia/Singapore',
  'Tokyo': 'Asia/Tokyo',
  'Mumbai': 'Asia/Kolkata',
  'Delhi': 'Asia/Kolkata',
  'Los Angeles': 'America/Los_Angeles',
  'Chicago': 'America/Chicago',
  'Paris': 'Europe/Paris',
  'Berlin': 'Europe/Berlin',
  'Sydney': 'Australia/Sydney',
  'Dubai': 'Asia/Dubai',
  'Hong Kong': 'Asia/Hong_Kong',
};

// City descriptions
const CITY_DESCRIPTIONS: { [key: string]: string } = {
  'San Francisco': "Step into SF's dopest clubhouse for crypto natives and techno-optimists",
  'New York': "NYC's premier crypto hub for builders and innovators",
  'London': "London's cutting-edge blockchain community space",
  'Bangalore': "India's Silicon Valley crypto and tech meetup hub",
  'Bengaluru': "India's Silicon Valley crypto and tech meetup hub",
  'Singapore': "Southeast Asia's leading crypto and blockchain events center",
  'Tokyo': "Japan's premier Web3 and blockchain innovation space",
  'Mumbai': "India's financial capital and emerging crypto hub",
  'Los Angeles': "LA's creative tech and blockchain community",
  'Paris': "Europe's thriving Web3 and innovation ecosystem",
  'Berlin': "Europe's counterculture meets crypto revolution",
};

export default function CityInfoCard({ city }: CityInfoCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get timezone for the city (fallback to UTC)
  const cityTimezone = CITY_TIMEZONES[city] || 'UTC';
  
  // Get city description
  const cityDescription = CITY_DESCRIPTIONS[city] || `Welcome to ${city}`;

  // Get time in city timezone
  const cityTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: cityTimezone
  });

  // Calculate GMT offset for city timezone
  const getCityGmtOffset = () => {
    try {
      const cityDate = new Date(currentTime.toLocaleString('en-US', { timeZone: cityTimezone }));
      const utcDate = new Date(currentTime.toLocaleString('en-US', { timeZone: 'UTC' }));
      const offsetHours = Math.round((cityDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60));
      return offsetHours >= 0 ? `+${offsetHours.toString().padStart(2, '0')}` : offsetHours.toString().padStart(3, '0');
    } catch (error) {
      return '+00';
    }
  };

  // Local time (user's browser timezone)
  const localTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const getLocalGmtOffset = () => {
    const offsetMinutes = -currentTime.getTimezoneOffset();
    const offsetHours = offsetMinutes / 60;
    return offsetHours >= 0 ? `+${offsetHours.toString().padStart(2, '0')}` : offsetHours.toString().padStart(3, '0');
  };

  const cityGmtOffset = getCityGmtOffset();
  const localGmtOffset = getLocalGmtOffset();

  return (
    <div className="absolute top-4 sm:top-10 left-1/2 transform -translate-x-1/2 z-20 text-center max-w-2xl px-4">
      <div className="bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg px-4 py-3 sm:px-6 sm:py-4">
        {/* City Name & Time */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <h1 className="text-xl sm:text-3xl font-bold text-black">{city}</h1>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-black/90">
            <span>☀️</span>
            <span className="font-mono">{cityTime} GMT{cityGmtOffset}</span>
          </div>
        </div>

        {/* City Description */}
        <p className="text-xs sm:text-base text-black/90 mb-1">{cityDescription}</p>

        {/* Local Time */}
        {cityTimezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
          <p className="text-[10px] sm:text-xs text-black/70">
            Local Time: {localTime} GMT{localGmtOffset}
          </p>
        )}
      </div>
    </div>
  );
}

