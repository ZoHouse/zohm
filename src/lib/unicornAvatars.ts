/**
 * Unicorn Avatar Utility
 * Provides random unicorn avatars for users without profile pictures
 */

const unicornImages = [
  '/unicorn images/Unicorn_Crying.png',
  '/unicorn images/Unicorn_Rainbow.png',
  '/unicorn images/UnicornCool.png',
  '/unicorn images/UnicornMagnifyingGlass.png',
  '/unicorn images/UnicornMemes_poppedeye.png',
  '/unicorn images/UnicornMemes_v1-01.png',
  '/unicorn images/UnicornMemes_v1-02.png',
  '/unicorn images/UnicornMemes_v1-03.png',
  '/unicorn images/UnicornMemes_v1-04.png',
  '/unicorn images/UnicornMemes_v1-05.png',
  '/unicorn images/UnicornMemes_v1-06.png',
  '/unicorn images/UnicornMemes_v1-07.png',
  '/unicorn images/UnicornRainbowPuke.png',
  '/unicorn images/UnicornRocket.png',
];

/**
 * Get a random unicorn avatar image
 */
export const getRandomUnicorn = (): string => {
  const randomIndex = Math.floor(Math.random() * unicornImages.length);
  return unicornImages[randomIndex];
};

/**
 * Get a deterministic unicorn based on wallet address or user ID
 * This ensures the same user always gets the same unicorn (until they upload their own)
 */
export const getUnicornForAddress = (addressOrId: string): string => {
  if (!addressOrId || addressOrId === '') {
    // Fallback to first unicorn if no identifier
    return unicornImages[0];
  }
  
  // Simple hash function to convert address/ID to index
  let hash = 0;
  for (let i = 0; i < addressOrId.length; i++) {
    hash = ((hash << 5) - hash) + addressOrId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % unicornImages.length;
  return unicornImages[index];
};

/**
 * Get all available unicorn images
 */
export const getAllUnicorns = (): string[] => {
  return [...unicornImages];
};

