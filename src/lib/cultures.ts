/**
 * Cultural Categories for Events
 * Centralized configuration for all event culture types and their associated icons
 */

export type CultureType =
  | 'follow_your_heart'
  | 'design'
  | 'science_technology'
  | 'food'
  | 'games'
  | 'sports'
  | 'travel_adventure'
  | 'evolving_cultures'
  | 'business'
  | 'photography'
  | 'television_cinema'
  | 'health_fitness'
  | 'literature'
  | 'music_entertainment'
  | 'law_order'
  | 'nature_wildlife'
  | 'stories_journals'
  | 'home_lifestyle'
  | 'spiritual';

/**
 * Get the icon image path for a given culture type
 */
export const getCultureIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'follow_your_heart': '/Cultural Stickers/FollowYourHeart.png',
    'design': '/Cultural Stickers/Design.png',
    'science_technology': '/Cultural Stickers/Science&Technology.png',
    'food': '/Cultural Stickers/Food.png',
    'games': '/Cultural Stickers/Game.png',
    'sports': '/Cultural Stickers/Sport.png',
    'travel_adventure': '/Cultural Stickers/Travel&Adventure.png',
    'evolving_cultures': '/Cultural Stickers/Default (2).jpg',
    'business': '/Cultural Stickers/Business.png',
    'photography': '/Cultural Stickers/Photography.png',
    'television_cinema': '/Cultural Stickers/Television&Cinema.png',
    'health_fitness': '/Cultural Stickers/Health&Fitness.png',
    'literature': '/Cultural Stickers/Literature&Stories.png',
    'music_entertainment': '/Cultural Stickers/Music&Entertainment.png',
    'law_order': '/Cultural Stickers/Law.png',
    'nature_wildlife': '/Cultural Stickers/Nature&Wildlife.png',
    'stories_journals': '/Cultural Stickers/Stories&Journal.png',
    'home_lifestyle': '/Cultural Stickers/Home&Lifestyle.png',
    'spiritual': '/Cultural Stickers/Spiritual.png',
  };

  return iconMap[type] || '/Cultural Stickers/Default (2).jpg';
};

/**
 * Get the display name for a given culture type
 */
export const getCultureDisplayName = (type: string): string => {
  const nameMap: Record<string, string> = {
    'follow_your_heart': 'Follow Your Heart',
    'design': 'Design',
    'science_technology': 'Science & Technology',
    'food': 'Food',
    'games': 'Games',
    'sports': 'Sports',
    'travel_adventure': 'Travel & Adventure',
    'evolving_cultures': 'Evolving Cultures',
    'business': 'Business',
    'photography': 'Photography',
    'television_cinema': 'Television & Cinema',
    'health_fitness': 'Health & Fitness / Longevity',
    'literature': 'Literature',
    'music_entertainment': 'Music & Entertainment',
    'law_order': 'Law & Order',
    'nature_wildlife': 'Nature & Wildlife',
    'stories_journals': 'Stories & Journals',
    'home_lifestyle': 'Home & Lifestyle',
    'spiritual': 'Spiritual',
  };

  return nameMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get color theme for a culture type (for UI elements like borders, badges, etc.)
 */
export const getCultureColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'follow_your_heart': '#ec4899', // pink
    'design': '#8b5cf6', // purple
    'science_technology': '#3b82f6', // blue
    'food': '#f59e0b', // amber
    'games': '#10b981', // emerald
    'sports': '#ef4444', // red
    'travel_adventure': '#06b6d4', // cyan
    'evolving_cultures': '#a855f7', // purple
    'business': '#64748b', // slate
    'photography': '#14b8a6', // teal
    'television_cinema': '#8b5cf6', // violet
    'health_fitness': '#22c55e', // green
    'literature': '#f97316', // orange
    'music_entertainment': '#ec4899', // pink
    'law_order': '#1e40af', // blue
    'nature_wildlife': '#16a34a', // green
    'stories_journals': '#f59e0b', // amber
    'home_lifestyle': '#84cc16', // lime
    'spiritual': '#a855f7', // purple
  };

  return colorMap[type] || '#6366f1'; // default indigo
};

/**
 * Get all available culture types
 */
export const getAllCultures = (): CultureType[] => {
  return [
    'follow_your_heart',
    'design',
    'science_technology',
    'food',
    'games',
    'sports',
    'travel_adventure',
    'evolving_cultures',
    'business',
    'photography',
    'television_cinema',
    'health_fitness',
    'literature',
    'music_entertainment',
    'law_order',
    'nature_wildlife',
    'stories_journals',
    'home_lifestyle',
    'spiritual',
  ];
};




