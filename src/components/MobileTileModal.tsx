'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface MobileTileModalProps {
  isVisible: boolean;
  onClose: () => void;
  onTileClick: (section: 'events' | 'nodes' | 'quests' | 'dashboard') => void;
}

const MobileTileModal: React.FC<MobileTileModalProps> = ({ isVisible, onClose, onTileClick }) => {
  const tiles = [
    { id: 'events' as const, icon: '/events.png', label: 'Events', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'nodes' as const, icon: '/nodes.png', label: 'Nodes', gradient: 'from-purple-500 to-pink-500' },
    { id: 'quests' as const, icon: '/Quests.png', label: 'Quests', gradient: 'from-orange-500 to-red-500' },
    { id: 'dashboard' as const, icon: '/dashboard.png', label: 'Dashboard', gradient: 'from-green-500 to-emerald-500' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 h-1/2 bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* 4 Tiles Grid */}
          <div className="grid grid-cols-2 gap-4 px-6 pt-6">
            {tiles.map((tile) => (
              <motion.button
                key={tile.id}
                onClick={() => onTileClick(tile.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative h-32 rounded-2xl overflow-hidden
                  bg-gradient-to-br ${tile.gradient}
                  shadow-lg hover:shadow-xl transition-shadow
                  flex flex-col items-center justify-center
                  text-white
                `}
              >
                <img src={tile.icon} alt={tile.label} className="w-16 h-16 mb-2 object-contain" />
                <span className="text-lg font-bold">{tile.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Unicorn Close Button at bottom */}
          <div className="flex justify-center py-6">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-white shadow-2xl flex items-center justify-center text-3xl"
              style={{
                boxShadow: '0 8px 32px rgba(255, 105, 180, 0.4)',
              }}
            >
              🦄
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileTileModal;

