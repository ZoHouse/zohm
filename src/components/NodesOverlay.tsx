'use client';

import { useState, useEffect } from 'react';
import { getNodesFromDB, PartnerNodeRecord } from '@/lib/supabase';
import { getNodeTypeIcon, isImageIcon } from '@/lib/nodeTypes';

interface NodesOverlayProps {
  isVisible: boolean;
  onNodeClick?: (node: PartnerNodeRecord) => void;
  closeMapPopups?: (() => void) | null;
  onClose?: () => void;
}

const NodesOverlay: React.FC<NodesOverlayProps> = ({ 
  isVisible, 
  onNodeClick,
  closeMapPopups 
}) => {
  const [nodes, setNodes] = useState<PartnerNodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    const loadNodes = async () => {
      setLoading(true);
      const data = await getNodesFromDB();
      if (data) setNodes(data);
      setLoading(false);
    };
    if (isVisible) {
      loadNodes();
    }
  }, [isVisible]);

  const filteredNodes = nodes.filter(n =>
    (activeFilter === 'all' || n.type === activeFilter) &&
    (
      !searchTerm ||
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.country.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleNodeClick = (node: PartnerNodeRecord) => {
    closeMapPopups?.();
    onNodeClick?.(node);
  };

  if (!isVisible) return null;

  return (
    <div className="hidden md:flex paper-overlay fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col">
      {/* Header - compact with inline search */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img src="/nodes.png" alt="Nodes" className="w-7 h-7 object-contain" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">Nodes</h2>
            <p className="text-xs text-gray-600">{nodes.length} worldwide</p>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="paper-input w-32 text-sm py-1 px-2"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`paper-button text-xs px-2 py-1 ${activeFilter === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          {([
            'schelling_point',
            'degen_lounge',
            'zo_studio',
            'flo_zone',
            'bored_room',
            'liquidity_pool',
            'multiverse',
            'battlefield',
            'bio_hack',
            'cafe',
            '420',
            'showcase',
            'culture_house',
            'hacker_house',
            'founder_house'
          ] as const).map(type => {
            const icon = getNodeTypeIcon(type);
            const isImage = isImageIcon(type);
            
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`paper-button text-xs px-2 py-1 whitespace-nowrap flex items-center gap-1 ${activeFilter === type ? 'active' : ''}`}
              >
                {isImage ? (
                  <img src={icon} alt={type} className="w-4 h-4 object-contain" />
                ) : (
                  <span>{icon}</span>
                )}
                {(
                  type === 'schelling_point' ? 'Schelling' :
                  type === 'degen_lounge' ? 'Degen' :
                  type === 'zo_studio' ? 'Studio' :
                  type === 'flo_zone' ? 'Flo' :
                  type === 'bored_room' ? 'Bored' :
                  type === 'liquidity_pool' ? 'Liquidity' :
                  type === 'multiverse' ? 'Multiverse' :
                  type === 'battlefield' ? 'Battlefield' :
                  type === 'bio_hack' ? 'Bio Hack' :
                  type === 'cafe' ? 'Cafe' :
                  type === '420' ? '420' :
                  type === 'showcase' ? 'Showcase' :
                  type === 'culture_house' ? 'Culture' :
                  type === 'hacker_house' ? 'Hacker' :
                  type === 'founder_house' ? 'Founder' : type
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading nodes...</div>
        ) : filteredNodes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No nodes found.</div>
        ) : (
          <div className="space-y-3">
            {filteredNodes.map(node => {
              const icon = getNodeTypeIcon(node.type);
              const isImage = isImageIcon(node.type);
              
              return (
                <div 
                  key={node.id} 
                  className="paper-card cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isImage ? (
                        <img src={icon} alt={node.type} className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-lg">{icon}</span>
                      )}
                      <h3 className="font-semibold text-base">{node.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-1 line-clamp-2">{node.description}</p>
                  <div className="text-xs text-gray-600">📍 {node.city}, {node.country}</div>
                  {node.website && (
                    <a 
                      href={node.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NodesOverlay;
