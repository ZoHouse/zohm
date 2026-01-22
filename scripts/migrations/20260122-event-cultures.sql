-- ============================================
-- Migration: Create event_cultures table
-- Date: 2026-01-22
-- Purpose: Store culture types for event categorization
-- ============================================

-- Create the event_cultures table
CREATE TABLE IF NOT EXISTS event_cultures (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT NOT NULL DEFAULT '#212121',
  asset_file TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active cultures sorted by order
CREATE INDEX IF NOT EXISTS idx_event_cultures_active ON event_cultures(is_active, sort_order);

-- ============================================
-- Seed 19 cultures with correct asset paths
-- Asset folder: /Cultural Stickers/
-- ============================================

INSERT INTO event_cultures (slug, name, emoji, color, asset_file, description, tags, sort_order) VALUES
('science_technology', 'Science & Technology', '🔬', '#4CAF50', 'Science&Technology.png', 'Tech, coding, AI, hackathons', ARRAY['tech', 'coding', 'ai', 'hackathon'], 1),
('business', 'Business', '💼', '#3F51B5', 'Business.png', 'Finance, startups, networking', ARRAY['finance', 'startup', 'networking', 'vc'], 2),
('design', 'Design', '🎨', '#E91E63', 'Design.png', 'UI/UX, graphics, creative tools', ARRAY['design', 'creative', 'ui', 'ux'], 3),
('food', 'Food', '🍕', '#FF9800', 'Food.png', 'Culinary, cooking, food tours', ARRAY['food', 'cooking', 'culinary', 'chef'], 4),
('game', 'Gaming', '🎮', '#2196F3', 'Game.png', 'Video games, board games, esports', ARRAY['gaming', 'esports', 'board-games', 'video-games'], 5),
('health_fitness', 'Health & Fitness', '💪', '#8BC34A', 'Health&Fitness.png', 'Exercise, wellness, training', ARRAY['fitness', 'gym', 'wellness', 'health'], 6),
('home_lifestyle', 'Home & Lifestyle', '🛋️', '#4CAF50', 'Home&Lifestyle.png', 'Casual hangouts, coworking', ARRAY['chill', 'coworking', 'casual', 'lifestyle'], 7),
('law', 'Law', '⚖️', '#607D8B', 'Law.png', 'Legal, policy, governance', ARRAY['legal', 'policy', 'law', 'governance'], 8),
('literature_stories', 'Literature & Stories', '📚', '#795548', 'Literature&Stories.png', 'Books, writing, poetry', ARRAY['books', 'writing', 'reading', 'poetry'], 9),
('music_entertainment', 'Music & Entertainment', '🎸', '#F44336', 'Music&Entertainment.png', 'Live music, jam sessions, karaoke', ARRAY['music', 'jam', 'karaoke', 'live-music'], 10),
('nature_wildlife', 'Nature & Wildlife', '🌻', '#CDDC39', 'Nature&Wildlife.png', 'Environment, outdoors, conservation', ARRAY['nature', 'outdoors', 'wildlife', 'environment'], 11),
('photography', 'Photography', '📸', '#9C27B0', 'Photography.png', 'Photo walks, editing, exhibitions', ARRAY['photography', 'camera', 'photo-walk'], 12),
('spiritual', 'Spiritual', '🧘', '#FF9800', 'Spiritual.png', 'Meditation, yoga, mindfulness', ARRAY['yoga', 'meditation', 'mindfulness', 'spiritual'], 13),
('travel_adventure', 'Travel & Adventure', '✈️', '#00BCD4', 'Travel&Adventure.png', 'Treks, road trips, exploration', ARRAY['travel', 'trek', 'adventure', 'exploration'], 14),
('television_cinema', 'Television & Cinema', '🎬', '#FFC107', 'Television&Cinema.png', 'Movies, watch parties, screenings', ARRAY['movies', 'tv', 'cinema', 'screening'], 15),
('stories_journal', 'Stories & Journal', '📰', '#FF5722', 'Stories&Journal.png', 'Journalism, storytelling, podcasts', ARRAY['journalism', 'storytelling', 'podcast'], 16),
('sport', 'Sports', '⚽', '#F44336', 'Sport.png', 'Cricket, football, badminton, outdoor sports', ARRAY['sports', 'cricket', 'football', 'badminton'], 17),
('follow_your_heart', 'Follow Your Heart', '❤️', '#E91E63', 'FollowYourHeart.png', 'General community events, miscellaneous', ARRAY['community', 'general', 'social'], 18),
('default', 'Other', '⬛', '#212121', 'Default (2).jpg', 'Uncategorized events', ARRAY['general', 'other'], 99)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color,
  asset_file = EXCLUDED.asset_file,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- Verify insertion
-- ============================================
-- SELECT slug, name, emoji, asset_file FROM event_cultures ORDER BY sort_order;
