'use client';

import { useState, useEffect } from 'react';
import { getNodesFromDB, PartnerNodeRecord } from '@/lib/supabase';
import { GlowChip, GlowButton, GlowCard } from '@/components/ui';

interface NodesOverlayProps {
  isVisible: boolean;
  nodes?: PartnerNodeRecord[];
  allNodes?: PartnerNodeRecord[];
  onNodeClick?: (node: PartnerNodeRecord) => void;
  closeMapPopups?: (() => void) | null;
  onClose?: () => void;
}

const NodesOverlay: React.FC<NodesOverlayProps> = ({ 
  isVisible, 
  nodes: providedNodes,
  allNodes,
  onNodeClick,
  closeMapPopups 
}) => {
  const [nodes, setNodes] = useState<PartnerNodeRecord[]>(providedNodes || allNodes || []);
  const [loading, setLoading] = useState(!(providedNodes || allNodes));
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone' | 'staynode'>('all');

  // Update nodes when provided via props (local/global filtering)
  useEffect(() => {
    if (providedNodes) {
      setNodes(providedNodes);
      setLoading(false);
      return;
    }
    if (allNodes) {
      setNodes(allNodes);
      setLoading(false);
      return;
    }
  }, [providedNodes, allNodes]);

  // Fallback to fetching from DB if no nodes provided
  useEffect(() => {
    if (providedNodes || allNodes || !isVisible) return;

    const loadNodes = async () => {
      setLoading(true);
      const data = await getNodesFromDB();
      if (data) setNodes(data);
      setLoading(false);
    };

    loadNodes();
  }, [isVisible, providedNodes, allNodes]);

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

  const getTypeIcon = (type: 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone' | 'staynode' | 'house' | 'collective' | 'protocol' | 'space' | 'festival' | 'dao'): string => {
    switch (type) {
      case 'hacker_space': return '⚡';
      case 'culture_house': return '🏠';
      case 'schelling_point': return '🎯';
      case 'flo_zone': return '🧭';
      case 'staynode': return '🛏️';
      case 'house': return '🏠';
      case 'collective': return '🌐';
      case 'protocol': return '⚡';
      case 'space': return '🏢';
      case 'festival': return '🎪';
      case 'dao': return '🏛️';
      default: return '🔗';
    }
  };

  const handleNodeClick = (node: PartnerNodeRecord) => {
    closeMapPopups?.();
    onNodeClick?.(node);
  };

  if (!isVisible) return null;

  return (
    <GlowCard className="hidden md:flex fixed top-10 right-5 bottom-10 w-[380px] z-[10001] flex-col">
      {/* Header - compact with inline search */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <img src="/nodes.png" alt="Nodes" className="w-7 h-7 object-contain" />
          <h2 className="text-xl font-bold text-black">Nodes</h2>
        </div>
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/30 text-black placeholder-gray-500 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all text-sm mb-3"
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          <GlowButton
            variant={activeFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setActiveFilter('all')}
            className="text-xs px-3 py-1.5"
          >
            All
          </GlowButton>
          {(['hacker_space','culture_house','schelling_point','flo_zone','staynode'] as const).map(type => (
            <GlowButton
              key={type}
              variant={activeFilter === type ? 'primary' : 'secondary'}
              onClick={() => setActiveFilter(type)}
              className="text-xs px-3 py-1.5 whitespace-nowrap"
            >
              {getTypeIcon(type)} {(
                type === 'hacker_space' ? 'Hacker' :
                type === 'culture_house' ? 'Culture' :
                type === 'schelling_point' ? 'Schelling' :
                type === 'flo_zone' ? 'Flo' :
                type === 'staynode' ? 'Stay' : type
              )}
            </GlowButton>
          ))}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-600 py-8">Loading nodes...</div>
        ) : filteredNodes.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No nodes found.</div>
        ) : (
          <div className="space-y-3">
            {filteredNodes.map(node => (
              <GlowCard 
                key={node.id} 
                hoverable
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(node.type)}</span>
                    <h3 className="font-semibold text-base text-black">{node.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">{node.description}</p>
                <div className="text-xs text-gray-600 mb-2">📍 {node.city}, {node.country}</div>
                {node.website && (
                  <a 
                    href={node.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-[#ff4d6d] hover:underline inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit Website →
                  </a>
                )}
              </GlowCard>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-center">
        <GlowButton
          variant="primary"
          onClick={() => window.open('https://form.typeform.com/to/voEnDiSl', '_blank')}
        >
          Host Your Node
        </GlowButton>
      </div>
    </GlowCard>
  );
};

export default NodesOverlay;
