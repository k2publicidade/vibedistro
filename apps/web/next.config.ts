import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@vibedistro/types'],
  experimental: {
    // Enable React 19 concurrent features
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.vibedistro.com' },
    ],
  },
  async rewrites() {
    // Proxy /api/v1/* to the NestJS API in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};

export default config;
