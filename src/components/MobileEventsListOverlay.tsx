'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (date: string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    
    const query = searchQuery.toLowerCase();
    return events.filter(event => 
      event['Event Name'].toLowerCase().includes(query) ||
      event.Location.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

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
                  <p className="text-sm text-gray-600">{events.length} upcoming events</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-600 font-bold">✕</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>{searchQuery ? 'No events match your search' : 'No events found'}</p>
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

