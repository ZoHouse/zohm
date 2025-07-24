'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';

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
  openProfile?: () => void;
}

const EventsOverlay: React.FC<EventsOverlayProps> = ({ isVisible, events, onEventClick, closeMapPopups, openProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocation, setActiveLocation] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>(events);
  const [wasVisible, setWasVisible] = useState(isVisible);
  
  const wallet = useWallet();

  useEffect(() => {
    if (wasVisible && !isVisible && closeMapPopups) {
      closeMapPopups();
    }
    setWasVisible(isVisible);
  }, [isVisible, wasVisible, closeMapPopups]);

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
    
    // Sort chronologically (earliest upcoming events first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a['Date & Time']);
      const dateB = new Date(b['Date & Time']);
      return dateA.getTime() - dateB.getTime();
    });
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, activeLocation]);

  const handleQuantumSync = async () => {
    if (openProfile) {
      openProfile();
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  if (!isVisible) return null;

  const renderHeader = () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-center">
        {wallet.isConnected && wallet.address ? (
          <div className="flex items-center justify-center gap-2">
            <div className="liquid-glass-button-alt px-4 py-2 font-semibold text-sm">🔗 {wallet.formatAddress(wallet.address)}</div>
            <button onClick={wallet.disconnectWallet} className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-red-600">✕</button>
          </div>
        ) : (
          <button onClick={handleQuantumSync} disabled={wallet.isLoading} className="liquid-glass-button px-6 py-2 text-sm">
            {wallet.isLoading ? '🔄 Syncing...' : '🧬 Quantum Sync'}
          </button>
        )}
      </div>
      {wallet.error && <div className="text-red-400 text-xs text-center bg-red-900/50 p-2 rounded-lg">{wallet.error}</div>}
      <div className="flex gap-2 justify-center">
        {['all', 'bangalore', 'sanfrancisco'].map(loc => (
          <button key={loc} onClick={() => setActiveLocation(loc)} className={`glass-icon-button px-3 py-2 text-xs font-medium capitalize ${activeLocation === loc ? 'bg-white/20' : ''}`}>
            {loc.replace('sanfrancisco', 'San Francisco')}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input type="text" placeholder="Search events" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 px-3 py-2 border border-white/10 rounded-lg bg-black/30 text-white/80 placeholder-white/40 focus:outline-none focus:border-white/30" />
        <button className="glass-icon-button px-4 py-2 text-sm">View All</button>
      </div>
      <div className="flex justify-center">
        <a 
          href="https://zostel.typeform.com/to/LgcBfa0M" 
          target="_blank" 
          rel="noopener noreferrer"
          className="solid-button px-6 py-2 text-sm hover:scale-105 transition-transform"
        >
          🎉 Host Events at Zo
        </a>
      </div>
    </div>
  );

  const renderEventList = (events: EventData[]) => (
    <ul className="flex flex-col gap-3 list-none p-0 m-0">
      {events.map((event, index) => (
        <li key={index} onClick={() => onEventClick?.(event)} className="liquid-glass-card p-3 flex gap-4 items-center cursor-pointer">
          <div className="text-3xl flex-shrink-0">📅</div>
          <div className="flex-grow">
            <h3 className="text-base font-bold">{event['Event Name']}</h3>
            <p className="text-sm text-white/70">📅 {formatDate(event['Date & Time'])}</p>
            <p className="text-sm text-white/70">📍 {event.Location}</p>
          </div>
          {event['Event URL'] && (
            <a href={event['Event URL']} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="solid-button px-4 py-2 text-sm self-center">
              Register
            </a>
          )}
        </li>
      ))}
    </ul>
  );

  const renderMobileEventList = (events: EventData[]) => (
    <div className="flex gap-3 h-full items-start">
      {events.map((event, index) => (
        <div key={index} onClick={() => onEventClick?.(event)} className="liquid-glass-card p-3 flex flex-col items-center text-center w-[140px] h-full flex-shrink-0 cursor-pointer">
          <h3 className="text-sm font-bold leading-tight line-clamp-3 w-full flex-1">{event['Event Name']}</h3>
          {event['Event URL'] && (
            <a href={event['Event URL']} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="solid-button mt-auto">
              Register
            </a>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="hidden md:flex fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col liquid-glass-pane p-0">
        {renderHeader()}
        <div className="flex-1 overflow-y-auto px-4 pb-4">{renderEventList(filteredEvents)}</div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[240px] z-100 flex flex-col liquid-glass-pane rounded-t-2xl rounded-b-none">
        {renderHeader()}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-2">
          {renderMobileEventList(filteredEvents)}
        </div>
      </div>
    </>
  );
};

export default EventsOverlay; 