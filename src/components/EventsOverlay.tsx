'use client';

import { useState, useEffect } from 'react';

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
    <div className="hidden md:flex paper-overlay fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col">
      {/* Header - compact with inline search */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img src="/events.png" alt="Events" className="w-7 h-7 object-contain" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">Events</h2>
            <p className="text-xs text-gray-600">{events.length} upcoming</p>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="paper-input w-32 text-sm py-1 px-2"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No events found.</div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => (
              <div
                key={index}
                className="paper-card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleEventClick(event)}
              >
                <h3 className="font-semibold text-base mb-1">{event['Event Name']}</h3>
                <p className="text-sm text-gray-700">📅 {formatDate(event['Date & Time'])}</p>
                <p className="text-sm text-gray-700">📍 {event.Location}</p>
                {event['Event URL'] && (
                  <a 
                    href={event['Event URL']} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex justify-center">
        <a 
          href="https://zostel.typeform.com/to/LgcBfa0M" 
          target="_blank" 
          rel="noopener noreferrer"
          className="paper-button text-center text-sm px-6"
        >
          Host Your Event
        </a>
      </div>
    </div>
  );
};

export default EventsOverlay;
