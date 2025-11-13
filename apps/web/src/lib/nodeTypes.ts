/**
 * Node Types and Icon Mapping
 * Centralized configuration for all partner node types and their associated icons
 */

export type NodeType =
  | 'schelling_point'
  | 'degen_lounge'
  | 'zo_studio'
  | 'flo_zone'
  | 'bored_room'
  | 'liquidity_pool'
  | 'multiverse'
  | 'battlefield'
  | 'bio_hack'
  | 'cafe'
  | '420'
  | 'showcase'
  | 'culture_house'
  | 'staynode'
  | 'hacker_house'
  | 'founder_house'
  // Legacy types (for backward compatibility)
  | 'hacker_space'
  | 'house'
  | 'collective'
  | 'protocol'
  | 'space'
  | 'festival'
  | 'dao';

/**
 * Get the icon for a given node type (emoji)
 */
export const getNodeTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    // Main node types
    'schelling_point': '🎯',
    'degen_lounge': '🎲',
    'zo_studio': '🎬',
    'flo_zone': '🧭',
    'bored_room': '🎮',
    'liquidity_pool': '💧',
    'multiverse': '🌌',
    'battlefield': '⚔️',
    'bio_hack': '🧬',
    'cafe': '☕',
    '420': '🌿',
    'showcase': '✨',
    'culture_house': '🏛️',
    'staynode': '🛏️',
    'hacker_house': '⚡',
    'founder_house': '🏰',
    
    // Legacy types (for backward compatibility)
    'hacker_space': '⚡',
    'house': '🏠',
    'collective': '🌐',
    'protocol': '⚡',
    'space': '🏢',
    'festival': '🎪',
    'dao': '🏛️',
  };

  return iconMap[type] || '🔗';
};

/**
 * Get the display name for a given node type
 */
export const getNodeTypeDisplayName = (type: string): string => {
  const nameMap: Record<string, string> = {
    'schelling_point': 'Schelling Point',
    'degen_lounge': 'Degen Lounge',
    'zo_studio': 'Zo Studio',
    'flo_zone': 'Flo Zone',
    'bored_room': 'Bored Room',
    'liquidity_pool': 'Liquidity Pool',
    'multiverse': 'Multiverse',
    'battlefield': 'Battlefield (Turf)',
    'bio_hack': 'Bio Hack',
    'cafe': 'Cafe',
    '420': '420',
    'showcase': 'Showcase',
    'culture_house': 'Culture House',
    'staynode': 'Stay Node',
    'hacker_house': 'Hacker House',
    'founder_house': 'Founder House',
    
    // Legacy types
    'hacker_space': 'Hacker Space',
    'house': 'House',
    'collective': 'Collective',
    'protocol': 'Protocol',
    'space': 'Space',
    'festival': 'Festival',
    'dao': 'DAO',
  };

  return nameMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Check if a node type uses an image icon (vs emoji)
 * Currently all node types use emoji, but keeping this for future extensibility
 */
export const isImageIcon = (): boolean => {
  return false; // All nodes use emoji icons for now
};

/**
 * Get color theme for a node type (for UI elements like borders, badges, etc.)
 */
export const getNodeTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'schelling_point': '#3b82f6', // blue
    'degen_lounge': '#a855f7', // purple
    'zo_studio': '#ec4899', // pink
    'flo_zone': '#06b6d4', // cyan
    'bored_room': '#10b981', // emerald
    'liquidity_pool': '#0ea5e9', // sky blue
    'multiverse': '#8b5cf6', // violet
    'battlefield': '#ef4444', // red
    'bio_hack': '#22c55e', // green
    'cafe': '#f59e0b', // amber
    '420': '#84cc16', // lime
    'showcase': '#f97316', // orange
    'culture_house': '#8b5cf6', // violet
    'staynode': '#fbbf24', // amber
    'hacker_house': '#3b82f6', // blue
    'founder_house': '#ec4899', // pink
    
    // Legacy types
    'hacker_space': '#8b5cf6',
    'house': '#10b981',
    'collective': '#3b82f6',
    'protocol': '#8b5cf6',
    'space': '#f59e0b',
    'festival': '#ec4899',
    'dao': '#06b6d4',
  };

  return colorMap[type] || '#6366f1'; // default indigo
};

/**
 * Get all available node types
 */
export const getAllNodeTypes = (): NodeType[] => {
  return [
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
    'staynode',
    'hacker_house',
    'founder_house',
  ];
};
