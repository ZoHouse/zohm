'use client';

interface NavBarProps {
  onSectionChange: (section: 'members' | 'events' | 'cultures') => void;
  activeSection: 'members' | 'events' | 'cultures';
}

const NavBar: React.FC<NavBarProps> = ({ onSectionChange, activeSection }) => {
  const navItems = [
    { id: 'members' as const, icon: '👥', label: 'Members' },
    { id: 'events' as const, icon: '📅', label: 'Events' },
    { id: 'cultures' as const, icon: '🌍', label: 'Cultures' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 z-[1000] flex justify-center items-center pointer-events-none">
      <nav className="p-2 liquid-glass-pane rounded-full flex items-center gap-2 pointer-events-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`flex flex-col items-center justify-center w-20 h-16 rounded-full transition-all duration-300 relative glass-icon-button ${
              activeSection === item.id
                ? 'bg-white/20 border-white/20'
                : 'bg-transparent hover:bg-white/10'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default NavBar; 