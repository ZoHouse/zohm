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
  const [activeLocation, setActiveLocation] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>(events);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let filtered = events;
    if (activeLocation !== 'all') {
      filtered = filtered.filter(event => {
        const loc = event.Location.toLowerCase();
        if (activeLocation === 'bangalore') return loc.includes('bangalore') || loc.includes('bengaluru');
        if (activeLocation === 'sanfrancisco') return loc.includes('san francisco') || loc.includes('sf');
        return true;
      });
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(e => e['Event Name'].toLowerCase().includes(lower) || e.Location.toLowerCase().includes(lower));
    }
    setFilteredEvents(filtered);
  }, [events, searchTerm, activeLocation]);

  const formatDate = (date: string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  if (!isVisible) return null;

  const renderContent = () => (
    <>
      <h2 className="text-2xl font-bold mb-4 text-center">Events</h2>
      <div className="flex gap-2 mb-4">
        {['all', 'bangalore', 'sanfrancisco'].map(loc => (
          <button 
            key={loc} 
            onClick={() => setActiveLocation(loc)} 
            className={`paper-button flex-1 ${activeLocation === loc ? 'active' : ''}`}
          >
            {loc === 'all' ? 'All' : loc === 'bangalore' ? 'BLR' : 'SF'}
          </button>
        ))}
      </div>
      <input 
        type="text"
        placeholder="Search events..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="paper-input w-full mb-4"
      />
      <div className="flex-1 overflow-y-auto">
        {filteredEvents.map((event, index) => (
          <div key={index} onClick={() => onEventClick?.(event)} className="paper-card flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg mb-1">{event['Event Name']}</h3>
              <p className="text-sm">{formatDate(event['Date & Time'])}</p>
              <p className="text-sm">{event.Location}</p>
            </div>
            {event['Event URL'] && (
              <div className="flex-shrink-0 ml-4">
                <a href={event['Event URL']} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="paper-button">
                  Register
                </a>
              </div>
            )}
          </div>
        ))}
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
