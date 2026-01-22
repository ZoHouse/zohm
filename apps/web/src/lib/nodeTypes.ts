/**
 * Node Types and Zone Types - City Coordination Layer
 * 
 * 18 Node Types for map markers
 * 13 Zone Types for spaces within nodes
 * 
 * @version 2.0
 * @updated 2026-01-21
 */

// ============================================
// Type Definitions
// ============================================

export type NodeType =
  | 'zo_house'
  | 'zostel'
  | 'food'
  | 'stay'
  | 'park'
  | 'hospital'
  | 'fire_station'
  | 'post_office'
  | 'bar'
  | 'metro'
  | 'airport'
  | 'shopping'
  | 'art'
  | 'sports_arena'
  | 'arcade'
  | 'library'
  | 'gym'
  | 'startup_hub';

export type NodeStatus = 'active' | 'developing' | 'planning';

export type ZoneType =
  | 'schelling_point'
  | 'degen_lounge'
  | 'zo_studio'
  | 'flo_zone'
  | 'liquidity_pool'
  | 'multiverse'
  | 'battlefield'
  | 'bio_hack'
  | 'zo_cafe'
  | '420'
  | 'showcase'
  | 'dorms'
  | 'private_rooms';

export interface NodeIcon {
  type: 'logo' | 'emoji';
  value: string;
}

// ============================================
// Node Type Configuration
// ============================================

const NODE_TYPE_CONFIG: Record<NodeType, { icon: NodeIcon; displayName: string; color: string }> = {
  zo_house: {
    icon: { type: 'logo', value: '/logos/zo-house.svg' }, // Zo logo with CSS animation
    displayName: 'Zo House',
    color: '#ff4d6d', // Zo pink
  },
  zostel: {
    icon: { type: 'logo', value: '/logos/zostel.svg' },
    displayName: 'Zostel',
    color: '#f97316', // orange
  },
  food: {
    icon: { type: 'emoji', value: '🍱' },
    displayName: 'Food',
    color: '#f59e0b', // amber
  },
  stay: {
    icon: { type: 'emoji', value: '🛏️' },
    displayName: 'Stay',
    color: '#8b5cf6', // violet
  },
  park: {
    icon: { type: 'emoji', value: '🌳' },
    displayName: 'Park',
    color: '#22c55e', // green
  },
  hospital: {
    icon: { type: 'emoji', value: '🏥' },
    displayName: 'Hospital',
    color: '#ef4444', // red
  },
  fire_station: {
    icon: { type: 'emoji', value: '🧯' },
    displayName: 'Fire Station',
    color: '#dc2626', // red-600
  },
  post_office: {
    icon: { type: 'emoji', value: '📮' },
    displayName: 'Post Office',
    color: '#3b82f6', // blue
  },
  bar: {
    icon: { type: 'emoji', value: '🍺' },
    displayName: 'Bar',
    color: '#fbbf24', // amber-400
  },
  metro: {
    icon: { type: 'emoji', value: '🚊' },
    displayName: 'Metro',
    color: '#06b6d4', // cyan
  },
  airport: {
    icon: { type: 'emoji', value: '✈️' },
    displayName: 'Airport',
    color: '#0ea5e9', // sky
  },
  shopping: {
    icon: { type: 'emoji', value: '🛍️' },
    displayName: 'Shopping',
    color: '#ec4899', // pink
  },
  art: {
    icon: { type: 'emoji', value: '🎨' },
    displayName: 'Art',
    color: '#a855f7', // purple
  },
  sports_arena: {
    icon: { type: 'emoji', value: '🏟️' },
    displayName: 'Sports Arena',
    color: '#10b981', // emerald
  },
  arcade: {
    icon: { type: 'emoji', value: '🕹️' },
    displayName: 'Arcade',
    color: '#6366f1', // indigo
  },
  library: {
    icon: { type: 'emoji', value: '📚' },
    displayName: 'Library',
    color: '#78716c', // stone
  },
  gym: {
    icon: { type: 'emoji', value: '🏋️' },
    displayName: 'Gym',
    color: '#14b8a6', // teal
  },
  startup_hub: {
    icon: { type: 'emoji', value: '👨‍💻' },
    displayName: 'Startup Hub',
    color: '#3b82f6', // blue
  },
};

// ============================================
// Zone Type Configuration
// ============================================

const ZONE_TYPE_CONFIG: Record<ZoneType, { displayName: string; description: string }> = {
  schelling_point: {
    displayName: 'Schelling Point',
    description: 'Coordination/meeting space',
  },
  degen_lounge: {
    displayName: 'Degen Lounge',
    description: 'Social/trading culture space',
  },
  zo_studio: {
    displayName: 'Zo Studio',
    description: 'Recording/production facility',
  },
  flo_zone: {
    displayName: 'Flo Zone',
    description: 'Deep work/flow state workspace',
  },
  liquidity_pool: {
    displayName: 'Liquidity Pool',
    description: 'Pool/water feature',
  },
  multiverse: {
    displayName: 'Multiverse',
    description: 'Multi-purpose flex space',
  },
  battlefield: {
    displayName: 'Battlefield',
    description: 'Competition/sports area',
  },
  bio_hack: {
    displayName: 'Bio Hack',
    description: 'Health/fitness/biohacking',
  },
  zo_cafe: {
    displayName: 'Zo Cafe',
    description: 'Food/coffee service',
  },
  '420': {
    displayName: '420',
    description: 'Smoking-friendly space',
  },
  showcase: {
    displayName: 'Showcase',
    description: 'Exhibition/display area',
  },
  dorms: {
    displayName: 'Dorms',
    description: 'Shared accommodation',
  },
  private_rooms: {
    displayName: 'Private Rooms',
    description: 'Private accommodation',
  },
};

// ============================================
// Node Type Functions
// ============================================

/**
 * Get icon for a node type (used for map markers)
 */
export const getNodeIcon = (type: NodeType): NodeIcon => {
  return NODE_TYPE_CONFIG[type]?.icon ?? { type: 'emoji', value: '📍' };
};

/**
 * Get display name for node type
 */
export const getNodeTypeDisplayName = (type: NodeType): string => {
  return NODE_TYPE_CONFIG[type]?.displayName ?? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get color theme for a node type (for UI elements)
 */
export const getNodeTypeColor = (type: NodeType): string => {
  return NODE_TYPE_CONFIG[type]?.color ?? '#6366f1'; // default indigo
};

/**
 * Get emoji for a node type (for quick display)
 * Returns the emoji or a fallback for logo-based types
 */
export const getNodeTypeEmoji = (type: NodeType): string => {
  const icon = NODE_TYPE_CONFIG[type]?.icon;
  if (icon?.type === 'emoji') {
    return icon.value;
  }
  // Fallback emojis for logo types
  if (type === 'zo_house') return '🏠';
  if (type === 'zostel') return '🏨';
  return '📍';
};

/**
 * Check if node type uses logo (zo_house, zostel)
 */
export const isLogoNode = (type: NodeType): boolean => {
  return NODE_TYPE_CONFIG[type]?.icon.type === 'logo';
};

/**
 * Check if node is Zo-owned (zo_house or zostel)
 */
export const isZoOwned = (type: NodeType): boolean => {
  return type === 'zo_house' || type === 'zostel';
};

/**
 * Get all node types
 */
export const getAllNodeTypes = (): NodeType[] => {
  return Object.keys(NODE_TYPE_CONFIG) as NodeType[];
};

// ============================================
// Zone Type Functions
// ============================================

/**
 * Get display name for zone type
 */
export const getZoneTypeDisplayName = (type: ZoneType): string => {
  return ZONE_TYPE_CONFIG[type]?.displayName ?? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get description for zone type
 */
export const getZoneTypeDescription = (type: ZoneType): string => {
  return ZONE_TYPE_CONFIG[type]?.description ?? '';
};

/**
 * Get all zone types
 */
export const getAllZoneTypes = (): ZoneType[] => {
  return Object.keys(ZONE_TYPE_CONFIG) as ZoneType[];
};

// ============================================
// Legacy Compatibility (deprecated)
// ============================================

/**
 * @deprecated Use getNodeTypeEmoji instead
 */
export const getNodeTypeIcon = (type: string): string => {
  return getNodeTypeEmoji(type as NodeType);
};
