'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventData {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

interface MobileEventsListOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  events: EventData[];
  onEventClick?: (event: EventData) => void;
}

const MobileEventsListOverlay: React.FC<MobileEventsListOverlayProps> = ({ 
  isVisible, 
  onClose, 
  events,
  onEventClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 h-1/2 bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src="/events.png" alt="Events" className="w-8 h-8 object-contain" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Events</h2>
                  <p className="text-sm text-gray-600">{filteredEvents.length} {searchTerm ? 'found' : 'upcoming'} events</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-600 font-bold">✕</span>
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search events by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>{searchTerm ? 'No events found matching your search' : 'No events found'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      onEventClick?.(event);
                      onClose();
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:border-blue-400 transition-all text-left"
                  >
                    <h3 className="font-bold text-gray-800 mb-1">{event['Event Name']}</h3>
                    <p className="text-sm text-gray-600">📍 {event.Location}</p>
                    <p className="text-xs text-blue-600 mt-1">🕐 {formatDate(event['Date & Time'])}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Host Event Button */}
          <div className="px-6 py-4 border-t border-gray-200">
            <a 
              href="https://zostel.typeform.com/to/LgcBfa0M" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl text-center hover:shadow-lg transition-shadow"
            >
              Host Your Event
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileEventsListOverlay;

