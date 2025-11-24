'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNodesFromDB, PartnerNodeRecord } from '@/lib/supabase';
import { GlowChip, GlowCard, GlowButton } from '@/components/ui';

interface MobileNodesListOverlayProps {
  isVisible: boolean;
  nodes?: PartnerNodeRecord[];
  allNodes?: PartnerNodeRecord[];
  onClose: () => void;
  onNodeClick?: (node: PartnerNodeRecord) => void;
}

const MobileNodesListOverlay: React.FC<MobileNodesListOverlayProps> = ({ 
  isVisible, 
  nodes: providedNodes,
  allNodes,
  onClose,
  onNodeClick 
}) => {
  const [nodes, setNodes] = useState<PartnerNodeRecord[]>(providedNodes || allNodes || []);
  const [loading, setLoading] = useState(!(providedNodes || allNodes));
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter nodes based on search term
  const filteredNodes = nodes.filter(node => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      node.name.toLowerCase().includes(lower) ||
      node.description.toLowerCase().includes(lower) ||
      node.city.toLowerCase().includes(lower) ||
      node.country.toLowerCase().includes(lower)
    );
  });

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'hacker_space': return '⚡';
      case 'culture_house': return '🏠';
      case 'schelling_point': return '🎯';
      case 'flo_zone': return '🧭';
      case 'staynode': return '🛏️';
      default: return '🔗';
    }
  };

  return (
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
                <img src="/nodes.png" alt="Nodes" className="w-8 h-8 object-contain" />
                <h2 className="text-2xl font-bold text-black">Nodes</h2>
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
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/30 text-black placeholder-gray-500 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all text-sm"
            />
          </div>

          {/* Nodes List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="text-center text-gray-600 py-8">
                <p>Loading nodes...</p>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                <p>No nodes found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNodes.map((node) => (
                  <motion.div
                    key={node.id}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GlowCard
                      onClick={() => {
                        onNodeClick?.(node);
                        onClose();
                      }}
                      hoverable
                      className="cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{getTypeIcon(node.type)}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-black">{node.name}</h3>
                          <p className="text-sm text-gray-700 line-clamp-2 mt-1">{node.description}</p>
                          <p className="text-xs text-gray-600 mt-2">📍 {node.city}, {node.country}</p>
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Host Node Button */}
          <div className="px-6 py-4 border-t border-white/20">
            <GlowButton
              variant="primary"
              onClick={() => window.open('https://form.typeform.com/to/voEnDiSl', '_blank')}
              className="w-full"
            >
              Host Your Node
            </GlowButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileNodesListOverlay;

