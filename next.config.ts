import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['shapefile'],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, stream: false };
    return config;
  },
  async headers() {
    return [
      {
        // Permite que o sw.js (na raiz) controle o scope /avistamento-javali/
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
};

export default nextConfig;
