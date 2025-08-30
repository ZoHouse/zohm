'use client';

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
      <div className="paper-nav max-w-lg mx-auto">
        <nav className="flex items-center justify-around">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`paper-nav-item ${activeSection === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
          
          {/* Dashboard Button */}
          <button
            onClick={onDashboardClick}
            className="paper-nav-item"
          >
            Dashboard
          </button>
        </nav>
      </div>
    </div>
  );
};

export default NavBar;
