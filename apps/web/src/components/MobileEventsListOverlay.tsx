'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowChip, GlowButton, GlowCard } from '@/components/ui';
import { HostEventModal } from '@/components/events';
import { getEventCoverImage } from '@/lib/eventCoverDefaults';

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
  userId?: string;
}

const MobileEventsListOverlay: React.FC<MobileEventsListOverlayProps> = ({ 
  isVisible, 
  onClose, 
  events,
  onEventClick,
  userId
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isHostModalOpen, setIsHostModalOpen] = React.useState(false);

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
    <>
      {/* Host Event Modal - rendered outside AnimatePresence so it persists */}
      <HostEventModal
        isOpen={isHostModalOpen}
        onClose={() => setIsHostModalOpen(false)}
        userId={userId}
        onSuccess={() => {
          setIsHostModalOpen(false);
        }}
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-0 right-0 h-1/2 bg-white/20 backdrop-blur-md border-t border-white/40 rounded-t-3xl shadow-2xl z-[10001] overflow-hidden flex flex-col"
          style={{
            bottom: 'env(safe-area-inset-bottom)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
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
                {filteredAndSortedEvents.map((event, index) => {
                  const eventAny = event as any;
                  const isCommunityEvent = eventAny._category === 'community';
                  const culture = eventAny._culture;
                  const coverImageUrl = getEventCoverImage({
                    coverImageUrl: eventAny._cover_image_url,
                    culture: culture,
                    category: eventAny._category,
                  });
                  
                  return (
                    <motion.div
                      key={eventAny._id || index}
                      whileTap={{ scale: 0.98 }}
                    >
                      <GlowCard
                        onClick={() => {
                          onEventClick?.(event);
                          onClose();
                        }}
                        hoverable
                        className="cursor-pointer !p-0 overflow-hidden"
                      >
                        {/* Cover Image - always show with default fallback */}
                        <div className="w-full h-20 overflow-hidden">
                          <img 
                            src={coverImageUrl} 
                            alt={event['Event Name']}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3">
                          {isCommunityEvent && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/20 text-green-700 rounded-full">
                                🌱 Community
                              </span>
                              {culture && culture !== 'default' && (
                                <span className="text-[10px] text-gray-500 capitalize">
                                  {culture.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          )}
                          <h3 className="font-bold text-black mb-1">{event['Event Name']}</h3>
                          <p className="text-sm text-gray-700">📍 {event.Location}</p>
                          <p className="text-xs text-gray-600 mt-1">🕐 {formatDate(event['Date & Time'])}</p>
                        </div>
                      </GlowCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Host Event Button */}
          <div className="px-6 py-4 border-t border-white/20">
            <GlowButton
              variant="primary"
              onClick={() => {
                setIsHostModalOpen(true);
                // Close the events list so it doesn't overlap with the modal
                onClose();
              }}
              className="w-full"
            >
              Host an Event
            </GlowButton>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileEventsListOverlay;

