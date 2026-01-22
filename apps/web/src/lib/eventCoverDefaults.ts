/**
 * Default cover images for events based on culture/category
 * Uses Cultural Stickers assets for culture-specific defaults
 */

import { EventCulture, EventCategory } from '@/types/events';

// Culture to default cover image mapping
const CULTURE_COVER_IMAGES: Record<EventCulture, string> = {
  science_technology: '/Cultural Stickers/Science&Technology.png',
  business: '/Cultural Stickers/Business.png',
  design: '/Cultural Stickers/Design.png',
  food: '/Cultural Stickers/Food.png',
  game: '/Cultural Stickers/Game.png',
  health_fitness: '/Cultural Stickers/Health&Fitness.png',
  home_lifestyle: '/Cultural Stickers/Home&Lifestyle.png',
  law: '/Cultural Stickers/Law.png',
  literature_stories: '/Cultural Stickers/Literature&Stories.png',
  music_entertainment: '/Cultural Stickers/Music&Entertainment.png',
  nature_wildlife: '/Cultural Stickers/Nature&Wildlife.png',
  photography: '/Cultural Stickers/Photography.png',
  spiritual: '/Cultural Stickers/Spiritual.png',
  sport: '/Cultural Stickers/Sport.png',
  stories_journal: '/Cultural Stickers/Stories&Journal.png',
  television_cinema: '/Cultural Stickers/Television&Cinema.png',
  travel_adventure: '/Cultural Stickers/Travel&Adventure.png',
  follow_your_heart: '/Cultural Stickers/FollowYourHeart.png',
  default: '/dashboard-assets/event-placeholder.jpg',
};

// Category to default cover image mapping (fallback when culture not available)
const CATEGORY_COVER_IMAGES: Record<EventCategory, string> = {
  community: '/dashboard-assets/community-demo-day.jpg',
  sponsored: '/dashboard-assets/zo-house-blr.jpg',
  ticketed: '/dashboard-assets/main-quest-wallapp.jpg',
};

// General fallback
const DEFAULT_COVER_IMAGE = '/dashboard-assets/event-placeholder.jpg';

/**
 * Get the default cover image URL for an event based on its culture and category
 * Priority: 1. Uploaded cover image → 2. Culture-based default → 3. Category-based default → 4. General fallback
 */
export function getEventCoverImage(options: {
  coverImageUrl?: string | null;
  culture?: EventCulture | string | null;
  category?: EventCategory | string | null;
}): string {
  const { coverImageUrl, culture, category } = options;
  
  // If event has an uploaded cover image, use it
  if (coverImageUrl) {
    return coverImageUrl;
  }
  
  // Try culture-based default
  if (culture && culture in CULTURE_COVER_IMAGES) {
    return CULTURE_COVER_IMAGES[culture as EventCulture];
  }
  
  // Try category-based default
  if (category && category in CATEGORY_COVER_IMAGES) {
    return CATEGORY_COVER_IMAGES[category as EventCategory];
  }
  
  // Return general fallback
  return DEFAULT_COVER_IMAGE;
}

/**
 * Get just the culture-based cover image (without fallback logic)
 */
export function getCultureCoverImage(culture: EventCulture): string {
  return CULTURE_COVER_IMAGES[culture] || DEFAULT_COVER_IMAGE;
}

/**
 * Check if an event has a custom cover image (not a default)
 */
export function hasCustomCoverImage(coverImageUrl?: string | null): boolean {
  if (!coverImageUrl) return false;
  
  // Check if it's one of the default images
  const defaultImages = [
    ...Object.values(CULTURE_COVER_IMAGES),
    ...Object.values(CATEGORY_COVER_IMAGES),
    DEFAULT_COVER_IMAGE,
  ];
  
  return !defaultImages.includes(coverImageUrl);
}

export { DEFAULT_COVER_IMAGE, CULTURE_COVER_IMAGES, CATEGORY_COVER_IMAGES };
