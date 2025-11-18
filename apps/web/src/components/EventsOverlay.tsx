'use client';

import { useState, useEffect } from 'react';
import { GlowChip, GlowButton, GlowCard } from '@/components/ui';

interface EventData {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

interface EventsOverlayProps {
  isVisible: boolean;
  events: EventData[];
  onEventClick?: (event: EventData) => void;
  closeMapPopups?: (() => void) | null;
  onClose?: () => void;
}

const EventsOverlay: React.FC<EventsOverlayProps> = ({ 
  isVisible, 
  events, 
  onEventClick,
  closeMapPopups 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>(events);

  useEffect(() => {
    let filtered = events;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e['Event Name'].toLowerCase().includes(lower) || 
        e.Location.toLowerCase().includes(lower)
      );
    }
    
    // Sort events chronologically by date (closest upcoming events first)
    filtered.sort((a, b) => {
      const dateA = new Date(a['Date & Time']);
      const dateB = new Date(b['Date & Time']);
      return dateA.getTime() - dateB.getTime();
    });
    
    setFilteredEvents(filtered);
  }, [events, searchTerm]);

  const formatDate = (date: string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEventClick = (event: EventData) => {
    closeMapPopups?.();
    onEventClick?.(event);
  };

  if (!isVisible) return null;

  return (
    <GlowCard className="hidden md:flex fixed top-[100px] right-5 bottom-10 w-[380px] z-[10001] flex-col">
      {/* Header - compact with inline search */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <img src="/events.png" alt="Events" className="w-7 h-7 object-contain" />
          <h2 className="text-xl font-bold text-black">Events</h2>
        </div>
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/30 text-black placeholder-gray-500 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all text-sm"
        />
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No events found.</div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => (
              <GlowCard
                key={index}
                hoverable
                onClick={() => handleEventClick(event)}
                className="cursor-pointer"
              >
                <h3 className="font-semibold text-base mb-2 text-black">{event['Event Name']}</h3>
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-gray-700">📅 {formatDate(event['Date & Time'])}</p>
                  <p className="text-sm text-gray-700">📍 {event.Location}</p>
                </div>
                {event['Event URL'] && (
                  <a 
                    href={event['Event URL']} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-[#ff4d6d] hover:underline inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details →
                  </a>
                )}
              </GlowCard>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-center">
        <GlowButton
          variant="primary"
          onClick={() => window.open('https://zostel.typeform.com/to/LgcBfa0M', '_blank')}
        >
          Host Your Event
        </GlowButton>
      </div>
    </GlowCard>
  );
};

export default EventsOverlay;
