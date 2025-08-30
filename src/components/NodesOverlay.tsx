'use client';

import { useState, useEffect } from 'react';
import { getNodesFromDB, PartnerNodeRecord } from '@/lib/supabase';

interface NodesOverlayProps {
  isVisible: boolean;
  onNodeClick?: (node: PartnerNodeRecord) => void;
  closeMapPopups?: (() => void) | null;
}

const NodesOverlay: React.FC<NodesOverlayProps> = ({ isVisible, onNodeClick, closeMapPopups }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone'>('all');
  const [allNodes, setAllNodes] = useState<PartnerNodeRecord[]>([]);

  useEffect(() => {
    const loadFromDB = async () => {
      const data = await getNodesFromDB();
      if (data) setAllNodes(data);
    };
    loadFromDB();
  }, []);
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredNodes = allNodes.filter(n =>
    (activeFilter === 'all' || n.type === activeFilter) &&
    (
      !searchTerm ||
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.country.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getTypeIcon = (type: 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone'): string => {
    switch (type) {
      case 'hacker_space': return '⚡';
      case 'culture_house': return '🏠';
      case 'schelling_point': return '🎯';
      case 'flo_zone': return '🧭';
      default: return '🔗';
    }
  };

  const formatMemberCount = (count?: number): string => {
    if (!count) return '';
    if (count < 1000) return `${count} members`;
    return `${(count / 1000).toFixed(1)}k members`;
  };

  if (!isVisible) return null;

  const renderContent = () => (
    <>
      <h2 className="text-2xl font-bold mb-4 text-center">Partner Nodes</h2>
      <input
        type="text"
        placeholder="Search nodes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="paper-input w-full mb-4"
      />
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`paper-button ${activeFilter === 'all' ? 'active' : ''}`}
        >
          All
        </button>
        {(['hacker_space','culture_house','schelling_point','flo_zone'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`paper-button ${activeFilter === type ? 'active' : ''}`}
          >
            {getTypeIcon(type)} {(
              type === 'hacker_space' ? 'Hacker Space' :
              type === 'culture_house' ? 'Culture House' :
              type === 'schelling_point' ? 'Schelling Point' :
              type === 'flo_zone' ? 'Flo Zone' : type
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredNodes.map(node => (
          <div key={node.id} className="paper-card" onClick={() => { closeMapPopups?.(); onNodeClick?.(node); }}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(node.type)}</span>
                <h3 className="font-semibold text-base">{node.name}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1 line-clamp-2">{node.description}</p>
            <div className="text-xs text-gray-600">📍 {node.city}, {node.country}</div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex paper-overlay fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col">
        {renderContent()}
      </div>

      {/* Mobile Layout */}
      <div 
        className={`md:hidden paper-overlay fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 ease-in-out ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-12rem)]'}`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="flex-col h-full">
          <div className="text-center py-2" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto"></div>
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default NodesOverlay;
