import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'background-dark': '#0A0A0A',
        'background-light': '#1C1C1E',
        'foreground-light': '#F5F5F7',
        'foreground-dark': '#8A8A8E',
        
        // Accent colors
        'accent-blue': '#0A84FF',
        'accent-purple': '#BF5AF2',
        
        // Zo brand colors
        'zo-dark': '#121212',
        'zo-primary': '#FF383C',
        'zo-accent': '#CFFF50',
        
        // Paper UI colors
        'paper-bg': '#f4f4f4',
        'paper-ink': '#1a1a1a',
        'paper-stroke': '#333',
        
        // Glass/Glow UI colors
        'glass-bg': 'rgba(28, 28, 30, 0.8)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'glow-chip-bg': 'rgba(255, 255, 255, 0.20)',
        'glow-chip-border': 'rgba(255, 255, 255, 0.40)',
        'glow-chip-text': '#ff4d6d',
        'glow-chip-dot': '#ff4d6d',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        paper: ['Comic Neue', 'Comic Sans MS', 'cursive'],
        syne: ['var(--font-syne)', 'sans-serif'],
      },
      spacing: {
        // Figma exact spacing values
        '52': '52px',
        '80': '80px',
        '156': '156px',
        '254': '254px',
        '272': '272px',
        '312': '312px',
        '320': '320px',
        '334': '334px',
        '360': '360px',
        '720': '720px',
        '800': '800px',
      },
      backdropBlur: {
        'glass': '40px',
      },
      boxShadow: {
        'paper': '4px 4px 0px rgba(0,0,0,0.2)',
        'paper-lg': '8px 8px 0px #1a1a1a',
        'paper-hover': '2px 2px 0px rgba(0,0,0,0.2)',
        'modal': '0px 4px 12px 0px rgba(18,18,18,0.16)',
        'glow': '0 0 15px rgba(255, 56, 60, 0.4)',
        'glow-strong': '0 0 25px rgba(255, 56, 60, 0.6)',
      },
      borderRadius: {
        'button': '12px',
        'modal': '24px',
        'pill': '9999px',
      },
      animation: {
        'slideUp': 'slideUp 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slideDown': 'slideDown 0.3s ease-in',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'astronautFloat': 'astronautFloat 3s ease-in-out infinite',
        'zo-pulse': 'zo-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'spin-reverse-slow': 'spin-reverse 25s linear infinite',
      },
      keyframes: {
        slideUp: {
          'from': { transform: 'translateY(100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          'from': { transform: 'translateY(0)', opacity: '1' },
          'to': { transform: 'translateY(100%)', opacity: '0' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.9)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        astronautFloat: {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
          '50%': { transform: 'translateX(-50%) translateY(-20px)' },
        },
        'zo-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.85' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config


