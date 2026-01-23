'use client';

/**
 * CultureSelector Component
 * 
 * A grid of culture icons for selecting event theme/vibe.
 * Matches the app's glassmorphic design.
 * 
 * Optimized for mobile: uses native img with lazy loading to prevent crashes
 */

import { useState, useEffect } from 'react';
import type { EventCultureConfig, EventCulture } from '@/types/events';
import { getCultureAssetUrl } from '@/types/events';
import { devLog } from '@/lib/logger';

interface CultureSelectorProps {
  value?: EventCulture;
  onChange: (culture: EventCulture) => void;
  disabled?: boolean;
}

// Fallback cultures when API is not available
const FALLBACK_CULTURES: EventCultureConfig[] = [
  { slug: 'science_technology', name: 'Science & Tech', emoji: '🔬', color: '#4CAF50', asset_file: 'Science&Technology.png', description: 'Tech, coding, AI', tags: [], is_active: true, sort_order: 1 },
  { slug: 'business', name: 'Business', emoji: '💼', color: '#3F51B5', asset_file: 'Business.png', description: 'Finance, startups', tags: [], is_active: true, sort_order: 2 },
  { slug: 'design', name: 'Design', emoji: '🎨', color: '#E91E63', asset_file: 'Design.png', description: 'UI/UX, creative', tags: [], is_active: true, sort_order: 3 },
  { slug: 'food', name: 'Food', emoji: '🍕', color: '#FF9800', asset_file: 'Food.png', description: 'Culinary, cooking', tags: [], is_active: true, sort_order: 4 },
  { slug: 'game', name: 'Gaming', emoji: '🎮', color: '#2196F3', asset_file: 'Game.png', description: 'Video games, esports', tags: [], is_active: true, sort_order: 5 },
  { slug: 'health_fitness', name: 'Health & Fitness', emoji: '💪', color: '#8BC34A', asset_file: 'Health&Fitness.png', description: 'Exercise, wellness', tags: [], is_active: true, sort_order: 6 },
  { slug: 'home_lifestyle', name: 'Lifestyle', emoji: '🛋️', color: '#4CAF50', asset_file: 'Home&Lifestyle.png', description: 'Casual hangouts', tags: [], is_active: true, sort_order: 7 },
  { slug: 'music_entertainment', name: 'Music', emoji: '🎸', color: '#F44336', asset_file: 'Music&Entertainment.png', description: 'Live music, jam', tags: [], is_active: true, sort_order: 8 },
  { slug: 'nature_wildlife', name: 'Nature', emoji: '🌻', color: '#CDDC39', asset_file: 'Nature&Wildlife.png', description: 'Outdoors', tags: [], is_active: true, sort_order: 9 },
  { slug: 'photography', name: 'Photography', emoji: '📸', color: '#9C27B0', asset_file: 'Photography.png', description: 'Photo walks', tags: [], is_active: true, sort_order: 10 },
  { slug: 'spiritual', name: 'Spiritual', emoji: '🧘', color: '#FF9800', asset_file: 'Spiritual.png', description: 'Yoga, meditation', tags: [], is_active: true, sort_order: 11 },
  { slug: 'travel_adventure', name: 'Travel', emoji: '✈️', color: '#00BCD4', asset_file: 'Travel&Adventure.png', description: 'Treks, road trips', tags: [], is_active: true, sort_order: 12 },
  { slug: 'television_cinema', name: 'Cinema', emoji: '🎬', color: '#FFC107', asset_file: 'Television&Cinema.png', description: 'Movies, screenings', tags: [], is_active: true, sort_order: 13 },
  { slug: 'sport', name: 'Sports', emoji: '⚽', color: '#F44336', asset_file: 'Sport.png', description: 'Cricket, football', tags: [], is_active: true, sort_order: 14 },
  { slug: 'literature_stories', name: 'Literature', emoji: '📚', color: '#795548', asset_file: 'Literature&Stories.png', description: 'Books, writing', tags: [], is_active: true, sort_order: 15 },
  { slug: 'follow_your_heart', name: 'Community', emoji: '❤️', color: '#E91E63', asset_file: 'FollowYourHeart.png', description: 'General events', tags: [], is_active: true, sort_order: 16 },
];

export function CultureSelector({ value, onChange, disabled }: CultureSelectorProps) {
  const [cultures, setCultures] = useState<EventCultureConfig[]>(FALLBACK_CULTURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCultures() {
      try {
        const res = await fetch('/api/events/cultures');
        if (!res.ok) throw new Error('Failed to fetch cultures');
        const data = await res.json();
        const fetchedCultures = data.cultures || [];
        setCultures(fetchedCultures.length > 0 ? fetchedCultures : FALLBACK_CULTURES);
      } catch (err) {
        devLog.error('Failed to fetch cultures, using fallback:', err);
        setCultures(FALLBACK_CULTURES);
      } finally {
        setLoading(false);
      }
    }
    fetchCultures();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-black/70 text-sm font-medium">What&apos;s the vibe of your event?</p>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="aspect-square rounded-2xl bg-white/20 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const selectedCulture = cultures.find(c => c.slug === value);

  return (
    <div className="space-y-4">
      <p className="text-black/70 text-sm font-medium">What&apos;s the vibe of your event?</p>
      
      {/* Grid with touch-action for smooth mobile scrolling */}
      <div className="grid grid-cols-4 gap-2" style={{ touchAction: 'pan-y' }}>
        {cultures.map((culture, index) => (
          <button
            key={culture.slug || `culture-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange(culture.slug as EventCulture)}
            className={`
              relative aspect-square rounded-2xl border-2 p-1.5
              flex flex-col items-center justify-center gap-1
              disabled:opacity-50 disabled:cursor-not-allowed
              transform-gpu transition-colors duration-150
              ${value === culture.slug
                ? 'border-[#ff4d6d] bg-[#ff4d6d]/10 shadow-lg scale-105'
                : 'border-white/30 bg-white/10 active:bg-white/30'
              }
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="w-9 h-9 flex items-center justify-center">
              {/* Use native img with lazy loading to prevent mobile crashes */}
              <img
                src={getCultureAssetUrl(culture.asset_file)}
                alt={culture.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[9px] text-center leading-tight text-black font-bold line-clamp-1">
              {culture.name}
            </span>
            
            {value === culture.slug && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff4d6d] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Selected culture preview */}
      {selectedCulture && (
        <div 
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/20 border border-white/30"
        >
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <img
              src={getCultureAssetUrl(selectedCulture.asset_file)}
              alt={selectedCulture.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="font-bold text-black flex items-center gap-2">
              <span>{selectedCulture.emoji}</span>
              <span>{selectedCulture.name}</span>
            </p>
            <p className="text-xs text-black/60 font-medium">
              {selectedCulture.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CultureSelector;
