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
}

const EventsOverlay: React.FC<EventsOverlayProps> = ({ isVisible, events, onEventClick, closeMapPopups }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>(events);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let filtered = events;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(e => e['Event Name'].toLowerCase().includes(lower) || e.Location.toLowerCase().includes(lower));
    }
    setFilteredEvents(filtered);
  }, [events, searchTerm]);

  const formatDate = (date: string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  // Check if event is from Zo House (based on location containing "Zo House")
  const isZoHouseEvent = (event: EventData) => {
    return event.Location && (
      event.Location.toLowerCase().includes('zo house') ||
      event.Location.toLowerCase().includes('zohouse')
    );
  };

  if (!isVisible) return null;

  const renderContent = () => (
    <>
      <h2 className="text-2xl font-bold mb-4 text-center">Events</h2>
      <input 
        type="text"
        placeholder="Search events..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="paper-input w-full mb-4"
      />
      <div className="flex-1 overflow-y-auto">
        {filteredEvents.map((event, index) => {
          const isZoEvent = isZoHouseEvent(event);
          return (
            <div 
              key={index} 
              onClick={() => { closeMapPopups?.(); onEventClick?.(event); }} 
              className={`paper-card flex justify-between items-center gap-3 ${isZoEvent ? 'zo-house-event' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 line-clamp-2">
                  {isZoEvent && <span className="zo-house-badge">🏠</span>}
                  {event['Event Name']}
                </h3>
                <p className="text-sm">{formatDate(event['Date & Time'])}</p>
                <p className="text-sm line-clamp-1">{event.Location}</p>
              </div>
              {event['Event URL'] && (
                <div className="flex-shrink-0">
                  <a 
                    href={event['Event URL']} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={e => e.stopPropagation()} 
                    className={`paper-button text-sm px-3 py-1 ${isZoEvent ? 'zo-house-button' : ''}`}
                  >
                    Register
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <a 
        href="https://zostel.typeform.com/to/LgcBfa0M" 
        target="_blank" 
        rel="noopener noreferrer"
        className="paper-button mt-4 text-center"
      >
        Host Your Event
      </a>
    </>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex paper-overlay fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col">
        {renderContent()}
      </div>

      {/* Mobile Layout */}
      <div 
        className={`md:hidden paper-overlay fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 ease-in-out ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-12rem)]'}`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="flex-col h-full">
          <div className="text-center py-2" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto"></div>
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default EventsOverlay;
