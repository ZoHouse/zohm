/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.mapbox.com'],
  },
  
  // Security headers
  async headers() {
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
            value: 'geolocation=*, camera=(), microphone=(), payment=()',
          },
        ],
      },
    ];
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'mapbox-gl'],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/public/zo.xyz-master/**'],
      };
    }
    return config;
  },
};

module.exports = nextConfig;

