'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingNavProps {
  onSectionChange: (section: 'events' | 'nodes' | 'quests') => void;
  activeSection: 'events' | 'nodes' | 'quests' | null;
}

const FloatingNav: React.FC<FloatingNavProps> = ({ onSectionChange, activeSection }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttons = [
    { id: 'events' as const, icon: '📅', label: 'Events' },
    { id: 'nodes' as const, icon: '🏠', label: 'Nodes' },
    { id: 'quests' as const, icon: '⚡', label: 'Quests' },
  ];

  const handleMainButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleButtonClick = (section: 'events' | 'nodes' | 'quests') => {
    onSectionChange(section);
    setIsExpanded(false);
  };

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2" style={{ zIndex: 9999 }}>
      {/* Expanded buttons */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-3"
          >
            {buttons.map((button, index) => (
              <motion.button
                key={button.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleButtonClick(button.id)}
                className={`
                  flex items-center gap-3 px-6 py-4 rounded-full
                  bg-white text-black border-2 border-black shadow-lg
                  hover:shadow-xl transition-all
                  ${activeSection === button.id ? 'bg-black text-white' : ''}
                `}
              >
                <span className="text-2xl">{button.icon}</span>
                <span className="font-bold whitespace-nowrap text-base">{button.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <motion.button
        onClick={handleMainButtonClick}
        animate={{ rotate: isExpanded ? 45 : 0 }}
        className="
          w-20 h-20 rounded-full
          bg-gradient-to-br from-pink-500 to-purple-600
          border-4 border-white shadow-2xl
          flex items-center justify-center
          text-4xl
          hover:scale-110 transition-transform
        "
        style={{
          boxShadow: '0 8px 32px rgba(255, 105, 180, 0.4)',
        }}
      >
        {isExpanded ? '✕' : '🦄'}
      </motion.button>
    </div>
  );
};

export default FloatingNav;

