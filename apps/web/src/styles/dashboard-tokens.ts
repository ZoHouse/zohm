/**
 * Dashboard Design Tokens
 * Extracted from Figma Design: https://www.figma.com/design/I8P5ECz7pOA4aBa4sxOBEM/zo.xyz?node-id=188-6757
 * 
 * These tokens ensure pixel-perfect implementation matching the Figma design
 */

export const DashboardColors = {
  // Background Colors
  background: {
    primary: 'rgba(0, 0, 0, 0.4)',      // Main card backgrounds with blur
    secondary: 'rgba(0, 0, 0, 0.08)',   // Header background with blur
    tertiary: '#121212',                 // Solid black for controls
    quaternary: '#202020',               // Solid black for switches/buttons
    pure: '#000000',                     // Pure black
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',                  // White text
    secondary: 'rgba(255, 255, 255, 0.8)',  // 80% opacity
    tertiary: 'rgba(255, 255, 255, 0.5)',   // 50% opacity (labels)
    quaternary: 'rgba(255, 255, 255, 0.4)', // 40% opacity (subtle)
  },
  
  // Border Colors
  border: {
    primary: 'rgba(255, 255, 255, 0.08)',   // Main borders
    secondary: 'rgba(255, 255, 255, 0.16)',  // Chips/tags borders
    tertiary: 'rgba(255, 255, 255, 0.1)',    // Subtle borders
  },
  
  // Chat/Message Colors
  chat: {
    bubble: 'rgba(255, 255, 255, 0.08)',     // Incoming messages
    userBubble: 'rgba(255, 255, 255, 0.24)', // User's messages
  },
  
  // Accent Colors
  accent: {
    focus: '#CFFF50',                    // Lime green for focus states
  },
} as const;

export const DashboardTypography = {
  // Font Families
  fontFamily: {
    primary: '"Rubik", sans-serif',
    display: '"Futura Std", "Futura", sans-serif',
  },
  
  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
    extraBold: 800,
  },
  
  // Font Sizes & Line Heights
  size: {
    // Display
    display: {
      fontSize: '48px',
      lineHeight: '40px',
      letterSpacing: '-1.44px',
      fontWeight: 800,
      fontFamily: '"Futura Std", sans-serif',
    },
    
    // Headers
    h1: {
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '0.24px',
      fontWeight: 700,
    },
    h2: {
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '-0.96px',
      fontWeight: 800,
      fontFamily: '"Futura Std", sans-serif',
    },
    
    // Body
    body: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
    },
    bodyMedium: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 500,
      letterSpacing: '0.16px',
    },
    
    // Small
    small: {
      fontSize: '14px',
      lineHeight: '21px',
      letterSpacing: '0.14px',
      fontWeight: 400,
    },
    smallMedium: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
    },
    
    // Caption
    caption: {
      fontSize: '12px',
      lineHeight: '18px',
      letterSpacing: '0.12px',
      fontWeight: 400,
    },
    captionMedium: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 500,
    },
    
    // Tiny
    tiny: {
      fontSize: '10px',
      lineHeight: '12px',
      fontWeight: 400,
    },
  },
} as const;

export const DashboardSpacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '40px',
  xxxl: '48px',
} as const;

export const DashboardRadius = {
  sm: '8px',
  md: '12px',
  lg: '24px',
  pill: '100px',
  circle: '50%',
} as const;

export const DashboardBlur = {
  light: '20px',
  medium: '32px',
  heavy: '40px',
} as const;

export const DashboardShadows = {
  card: '0px 4px 4px 0px rgba(18, 18, 18, 0.25)',
} as const;

export const DashboardAssets = {
  // Background (from Figma)
  background: '/dashboard-assets/dashboard-bg.jpg',
  
  // Logo & Branding (from Figma)
  logo: '/dashboard-assets/zo-world-icon.png',
  badge: '/dashboard-assets/comfyui-temp-iytpa-00048.png',
  
  // Culture icons (from Figma)
  culture: {
    design: '/dashboard-assets/design.png',
    tech: '/dashboard-assets/science-technology.png',
    food: '/dashboard-assets/food.png',
  },
  
  // Coin gradients (from Figma)
  coin: {
    gradient1: '/dashboard-assets/image-2.png',
    gradient2: '/dashboard-assets/image-3.png',
    gradient3: '/dashboard-assets/image-4.png',
  },
  
  // Profile Section (from Figma)
  profile: {
    frame: '/dashboard-assets/profile-frame.png', // Futuristic device frame
    photo: '/dashboard-assets/profile-photo.png', // Profile photo placeholder
    badge: '/dashboard-assets/badge-icon.svg', // Verified badge
  },

  // Avatars (from Figma)
  avatars: {
    default: '/dashboard-assets/avatar.png',
    member1: '/dashboard-assets/gdfp7elr-400x400.png',
    member2: '/dashboard-assets/gdfp7elr-400x401.png',
    member3: '/dashboard-assets/gdfp7elr-400x402.png',
    member4: '/dashboard-assets/gdfp7elr-400x403.png',
    player: '/dashboard-assets/avatar-1.png',
  },
  
  // Quests (from Figma)
  quests: {
    wallApp: '/dashboard-assets/4e45e0263bd2e484e1118ee4c3da505c26e22145-1.png',
  },
  
  // Founder NFTs (from Figma)
  nft: {
    nft1: '/dashboard-assets/430-1.png',
    nft2: '/dashboard-assets/430-2.png',
    nft3: '/dashboard-assets/430-3.png',
    nft4: '/dashboard-assets/430-4.png',
  },
  
  // Zo Houses / Nodes (from Figma)
  house: {
    sf: '/dashboard-assets/image.png',
    blr: '/dashboard-assets/img-4761-1.png',
    partner: '/dashboard-assets/img-4761-2.png',
    wtf: '/dashboard-assets/img-4761-3.png',
  },
  
  // Map assets (from Figma)
  map: {
    main: '/dashboard-assets/main.png',
    marker: '/dashboard-assets/image-1.png',
    zoBadge: '/dashboard-assets/comfyui-temp-iytpa-00048.png',
    group: '/dashboard-assets/group.svg',
  },
  
  // CTA Graphics (from Figma)
  graphics: {
    zoNode: '/dashboard-assets/rectangle-753.png',
    zoCard: '/dashboard-assets/rectangle-752.png',
  },
  
  // Virtual Rooms (from Figma)
  room: {
    schellingPoint: '/dashboard-assets/image-5.png',
    degenLounge: '/dashboard-assets/img-4761-1.png',
  },
  
  // Communities (from Figma)
  community: {
    demoDay: '/dashboard-assets/image-6.png',
    degenLounge: '/dashboard-assets/img-4761-3.png',
    zoCollective1: '/dashboard-assets/image-240.png',
    zoCollective2: '/dashboard-assets/image-241.png',
  },
  
  // Events (from Figma)
  event: {
    placeholder: '/dashboard-assets/rectangle-738.png',
  },
  
  // Stat Icons (from Figma) - $Zo coin overlays
  statIcons: {
    coin1: '/dashboard-assets/stat-icon-1.png',
    coin2: '/dashboard-assets/stat-icon-2.png',
    coin3: '/dashboard-assets/stat-icon-3.png',
  },

  // UI Icons (from Figma)
  icons: {
    wallet: '/dashboard-assets/wallet-icon.svg',
    walletAlt: '/dashboard-assets/wallet.svg',
    xTwitter: '/dashboard-assets/x-twitter-icon.svg',
    telegram: '/dashboard-assets/telegram-icon.svg',
    discord: '/dashboard-assets/social-media.svg',
    discordAlt: '/dashboard-assets/social-media-1.svg',
    copyArrow: '/dashboard-assets/copy-arrow.svg',
    dots: '/dashboard-assets/dots.svg',
    dotsAlt: '/dashboard-assets/dots-1.svg',
    play: '/dashboard-assets/play-icon.svg',
    menu1: '/dashboard-assets/menu-1.svg',
    menu2: '/dashboard-assets/menu-2.svg',
    menu3: '/dashboard-assets/menu-3.svg',
    menu4: '/dashboard-assets/menu-4.svg',
    globe: '/dashboard-assets/globe-icon.svg',
    x: '/dashboard-assets/x-icon.svg',
    attach: '/dashboard-assets/attach-icon.svg',
    search: '/dashboard-assets/search-ellipse.svg',
    add: '/dashboard-assets/add.svg',
    line1: '/dashboard-assets/line-1.svg',
    line2: '/dashboard-assets/line-2.svg',
    frame386: '/dashboard-assets/frame-386.svg',
  },
} as const;

// Utility function to apply glassmorphism effect
export const glassEffect = (blur: keyof typeof DashboardBlur = 'medium') => ({
  backdropFilter: `blur(${DashboardBlur[blur]})`,
  WebkitBackdropFilter: `blur(${DashboardBlur[blur]})`,
});

