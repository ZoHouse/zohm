'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowChip, GlowButton, GlowCard } from '@/components/ui';

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
  const [searchTerm, setSearchTerm] = React.useState('');

  const formatDate = (date: string) => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter and sort events
  const filteredAndSortedEvents = [...events]
    .filter(event => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        event['Event Name'].toLowerCase().includes(lower) ||
        event.Location.toLowerCase().includes(lower)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a['Date & Time']);
      const dateB = new Date(b['Date & Time']);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 h-1/2 bg-white/20 backdrop-blur-md border-t border-white/40 rounded-t-3xl shadow-2xl z-[10001] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src="/events.png" alt="Events" className="w-8 h-8 object-contain" />
                <h2 className="text-2xl font-bold text-black">Events</h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 border border-white/40 transition-colors"
              >
                <span className="text-black font-bold">✕</span>
              </button>
            </div>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/30 text-black placeholder-gray-500 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all text-sm"
            />
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredAndSortedEvents.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                <p>No events found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GlowCard
                      onClick={() => {
                        onEventClick?.(event);
                        onClose();
                      }}
                      hoverable
                      className="cursor-pointer"
                    >
                      <h3 className="font-bold text-black mb-1">{event['Event Name']}</h3>
                      <p className="text-sm text-gray-700">📍 {event.Location}</p>
                      <p className="text-xs text-gray-600 mt-1">🕐 {formatDate(event['Date & Time'])}</p>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Host Event Button */}
          <div className="px-6 py-4 border-t border-white/20">
            <GlowButton
              variant="primary"
              onClick={() => window.open('https://zostel.typeform.com/to/LgcBfa0M', '_blank')}
              className="w-full"
            >
              Host Your Event
            </GlowButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileEventsListOverlay;

