'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { getNodesFromDB, PartnerNodeRecord } from '@/lib/supabase';
import { getNodeTypeIcon, isImageIcon } from '@/lib/nodeTypes';

interface MobileNodesListOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onNodeClick?: (node: PartnerNodeRecord) => void;
}

const MobileNodesListOverlay: React.FC<MobileNodesListOverlayProps> = ({ 
  isVisible, 
  onClose,
  onNodeClick 
}) => {
  const [nodes, setNodes] = useState<PartnerNodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    
    const query = searchQuery.toLowerCase();
    return nodes.filter(node => 
      node.name.toLowerCase().includes(query) ||
      node.description.toLowerCase().includes(query) ||
      node.city.toLowerCase().includes(query) ||
      node.country.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 h-1/2 bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src="/nodes.png" alt="Nodes" className="w-8 h-8 object-contain" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Partner Nodes</h2>
                  <p className="text-sm text-gray-600">{nodes.length} nodes worldwide</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-600 font-bold">✕</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Nodes List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <p>Loading nodes...</p>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>{searchQuery ? 'No nodes match your search' : 'No nodes found'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNodes.map((node) => {
                  const icon = getNodeTypeIcon(node.type);
                  const isImage = isImageIcon(node.type);
                  
                  return (
                    <motion.button
                      key={node.id}
                      onClick={() => {
                        onNodeClick?.(node);
                        onClose();
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:border-purple-400 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        {isImage ? (
                          <img 
                            src={icon} 
                            alt={node.type} 
                            className="w-8 h-8 object-contain flex-shrink-0"
                          />
                        ) : (
                          <span className="text-2xl flex-shrink-0">{icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800">{node.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{node.description}</p>
                          <p className="text-xs text-purple-600 mt-2">📍 {node.city}, {node.country}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileNodesListOverlay;

