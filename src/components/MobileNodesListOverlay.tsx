'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNodesFromDB, PartnerNodeRecord } from '@/lib/supabase';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone'>('all');

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
      n.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.country?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'hacker_space': return '⚡';
      case 'culture_house': return '🏠';
      case 'schelling_point': return '🎯';
      case 'flo_zone': return '🧭';
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
          className="fixed bottom-0 left-0 right-0 h-1/2 bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src="/nodes.png" alt="Nodes" className="w-8 h-8 object-contain" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Partner Nodes</h2>
                  <p className="text-sm text-gray-600">{filteredNodes.length} {searchTerm || activeFilter !== 'all' ? 'found' : 'nodes'} worldwide</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-600 font-bold">✕</span>
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search nodes by name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {(['hacker_space','culture_house','schelling_point','flo_zone'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeFilter === type 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{getTypeIcon(type)}</span>
                  <span>
                    {type === 'hacker_space' ? 'Hacker' :
                     type === 'culture_house' ? 'Culture' :
                     type === 'schelling_point' ? 'Schelling' :
                     type === 'flo_zone' ? 'Flo' : type}
                  </span>
                </button>
              ))}
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
                <p>{searchTerm || activeFilter !== 'all' ? 'No nodes found matching your search' : 'No nodes found'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNodes.map((node) => (
                  <motion.button
                    key={node.id}
                    onClick={() => {
                      onNodeClick?.(node);
                      onClose();
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:border-purple-400 transition-all text-left"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{getTypeIcon(node.type)}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{node.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{node.description}</p>
                        <p className="text-xs text-purple-600 mt-2">📍 {node.city}, {node.country}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileNodesListOverlay;

