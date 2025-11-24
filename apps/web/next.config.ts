import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.mapbox.com'],
  },
  
  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=*, camera=*, microphone=*, payment=()',
          },
          // CSP: Allow unsafe-eval in dev for HMR, restrict in production
          // IMPORTANT: worker-src 'self' blob: is required for Mapbox GL JS
          // ZO API integration: https://api.io.zo.xyz
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://x.twimg.com https://js.intercomcdn.com https://apps.8thwall.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://x.twimg.com; font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai https://x.twimg.com https://js.intercomcdn.com https://fonts.intercomcdn.com data:; img-src 'self' data: blob: https: http:; media-src 'self' data: blob: https: http:; connect-src 'self' https://api.io.zo.xyz https: wss: http://localhost:* ws://localhost:*; frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org; worker-src 'self' blob:;`
              : `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://x.twimg.com https://apps.8thwall.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://x.twimg.com; font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai https://x.twimg.com https://js.intercomcdn.com https://fonts.intercomcdn.com data:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https://api.io.zo.xyz https: wss:; frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org; worker-src 'self' blob:;`
          },
        ],
      },
    ];
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'mapbox-gl'],
  },
};

export default nextConfig;
