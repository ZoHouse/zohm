'use client';

import { useState, useEffect } from 'react';
import { GlowChip, GlowButton, GlowCard } from '@/components/ui';
import { HostEventModal } from '@/components/events';

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
  userId?: string;  // For event creation
}

const EventsOverlay: React.FC<EventsOverlayProps> = ({ 
  isVisible, 
  events, 
  onEventClick,
  closeMapPopups,
  onClose,
  userId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>(events);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);

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

  // Render modal always (outside conditional), overlay conditionally
  return (
    <>
      {/* Host Event Modal - rendered outside overlay so it persists when overlay closes */}
      <HostEventModal
        isOpen={isHostModalOpen}
        onClose={() => setIsHostModalOpen(false)}
        userId={userId}
        onSuccess={(response) => {
          console.log('Event created:', response);
          setIsHostModalOpen(false);
          // TODO: Refresh events list or show success toast
        }}
      />

      {/* Events List Overlay */}
      {isVisible && (
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
            {filteredEvents.map((event, index) => {
              const eventAny = event as any;
              const isCommunityEvent = eventAny._category === 'community';
              const culture = eventAny._culture;
              
              return (
                <GlowCard
                  key={eventAny._id || index}
                  hoverable
                  onClick={() => handleEventClick(event)}
                  className="cursor-pointer"
                >
                  {/* Community event badge */}
                  {isCommunityEvent && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/20 text-green-700 rounded-full border border-green-500/30">
                        🌱 Community
                      </span>
                      {culture && culture !== 'default' && (
                        <span className="text-xs text-gray-500 capitalize">
                          {culture.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  )}
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
              );
            })}
          </div>
        )}
      </div>

        {/* Footer */}
        <div className="mt-4 flex justify-center">
          <GlowButton
            variant="primary"
            onClick={() => {
              setIsHostModalOpen(true);
              // Close the events overlay so it doesn't overlap with the modal
              onClose?.();
            }}
          >
            Host an Event
          </GlowButton>
        </div>
      </GlowCard>
      )}
    </>
  );
};

export default EventsOverlay;
