'use client';

/**
 * EventTypeSelector Component
 * 
 * Three options for selecting event type - matching app's glassmorphic design
 */

import type { EventCategory } from '@/types/events';

const EVENT_TYPES: {
  type: EventCategory;
  label: string;
  emoji: string;
  description: string;
  color: string;
  disabled?: boolean;
  comingSoon?: boolean;
}[] = [
  {
    type: 'community',
    label: 'Community-Led',
    emoji: '🌱',
    description: 'Create & host on Zo World',
    color: '#22c55e',
  },
  {
    type: 'sponsored',
    label: 'Sponsored',
    emoji: '⭐',
    description: 'Partner or brand events',
    color: '#a855f7',
  },
  {
    type: 'ticketed',
    label: 'Ticketed',
    emoji: '🎟️',
    description: 'Paid entry events',
    color: '#6b7280',
    disabled: true,
    comingSoon: true,
  },
];

interface EventTypeSelectorProps {
  value: EventCategory;
  onChange: (type: EventCategory) => void;
  onSponsoredClick?: () => void;
  disabled?: boolean;
}

export function EventTypeSelector({ value, onChange, onSponsoredClick, disabled }: EventTypeSelectorProps) {
  const handleClick = (eventType: typeof EVENT_TYPES[0]) => {
    if (eventType.disabled) return;
    
    if (eventType.type === 'sponsored' && onSponsoredClick) {
      onSponsoredClick();
      return;
    }
    
    onChange(eventType.type);
  };

  return (
    <div className="space-y-3">
      <p className="text-black/70 text-sm font-medium">What type of event do you want to host?</p>
      
      <div className="space-y-2">
        {EVENT_TYPES.map((eventType) => {
          const isSelected = value === eventType.type;
          const isDisabled = disabled || eventType.disabled;
          
          return (
            <button
              key={eventType.type}
              type="button"
              disabled={isDisabled}
              onClick={() => handleClick(eventType)}
              className={`
                relative w-full p-4 rounded-2xl border-2 text-left transition-all
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed border-white/20 bg-white/5' 
                  : isSelected
                    ? 'border-[#ff4d6d] bg-[#ff4d6d]/10 shadow-lg'
                    : 'border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50'
                }
              `}
            >
              {/* Coming Soon Badge */}
              {eventType.comingSoon && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-gray-500/50 text-[10px] font-medium rounded-full text-white">
                  Coming Soon
                </span>
              )}
              
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${eventType.color}20` }}
                >
                  {eventType.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-black">{eventType.label}</p>
                  <p className="text-xs text-black/60">{eventType.description}</p>
                </div>
                {isSelected && !isDisabled && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#ff4d6d' }}
                  >
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
              
              {/* Redirect indicator for sponsored */}
              {eventType.type === 'sponsored' && !isDisabled && (
                <p className="text-[10px] text-purple-700 font-medium mt-2 ml-16">
                  ↗ Opens external form
                </p>
              )}
            </button>
          );
        })}
      </div>
      
    </div>
  );
}

export default EventTypeSelector;
