'use client';

import { GlowButton } from '@/components/ui';

interface NavBarProps {
  onSectionChange: (section: 'events' | 'nodes' | 'quests') => void;
  activeSection: 'events' | 'nodes' | 'quests';
  onDashboardClick?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onSectionChange, activeSection, onDashboardClick }) => {
  const navItems = [
    { id: 'events' as const, label: 'Events' },
    { id: 'nodes' as const, label: 'Nodes' },
    { id: 'quests' as const, label: 'Quests' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-lg mx-auto bg-white/20 backdrop-blur-md border border-white/40 rounded-full shadow-lg p-2">
        <nav className="flex items-center justify-around gap-2">
          {navItems.map(item => (
            <GlowButton
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              variant={activeSection === item.id ? 'primary' : 'secondary'}
              showDot={activeSection === item.id}
              className="flex-1 text-sm"
            >
              {item.label}
            </GlowButton>
          ))}

          <GlowButton
            onClick={onDashboardClick}
            variant="secondary"
            className="flex-1 text-sm"
          >
            Dashboard
          </GlowButton>
        </nav>
      </div>
    </div>
  );
};

export default NavBar;
