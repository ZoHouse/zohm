'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GlowCard } from '@/components/ui';

interface MobileTileModalProps {
  isVisible: boolean;
  onClose: () => void;
  onTileClick: (section: 'events' | 'nodes' | 'quests' | 'dashboard') => void;
}

const MobileTileModal: React.FC<MobileTileModalProps> = ({ isVisible, onClose, onTileClick }) => {
  const tiles = [
    { id: 'events' as const, icon: '/events.png', label: 'Events' },
    { id: 'nodes' as const, icon: '/nodes.png', label: 'Nodes' },
    { id: 'quests' as const, icon: '/Quests.png', label: 'Quests' },
    { id: 'dashboard' as const, icon: '/dashboard.png', label: 'Dashboard' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-0 right-0 h-1/2 bg-white/20 backdrop-blur-md border-t border-white/40 rounded-t-3xl shadow-2xl z-[10001] overflow-hidden"
          style={{
            bottom: 'env(safe-area-inset-bottom)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-white/40 rounded-full"></div>
          </div>

          {/* 4 Tiles Grid */}
          <div className="grid grid-cols-2 gap-4 px-6 pt-6">
            {tiles.map((tile) => (
              <motion.div
                key={tile.id}
                whileTap={{ scale: 0.95 }}
              >
                <GlowCard
                  onClick={() => onTileClick(tile.id)}
                  hoverable
                  className="h-32 flex flex-col items-center justify-center cursor-pointer"
                >
                  <img src={tile.icon} alt={tile.label} className="w-16 h-16 mb-2 object-contain" />
                  <span className="text-lg font-bold text-black">{tile.label}</span>
                </GlowCard>
              </motion.div>
            ))}
          </div>

          {/* Unicorn Close Button at bottom */}
          <div 
            className="flex justify-center py-6"
            style={{
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            }}
          >
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff3355] border-4 border-white shadow-2xl flex items-center justify-center p-2"
              style={{
                boxShadow: '0 8px 32px rgba(255, 77, 109, 0.4)',
              }}
            >
              <img 
                src="/Cultural Stickers/FollowYourHeart.png" 
                alt="Follow Your Heart" 
                className="w-full h-full object-contain"
              />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileTileModal;

