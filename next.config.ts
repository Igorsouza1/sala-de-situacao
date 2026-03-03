import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['shapefile'],
  serverActions: {
    bodySizeLimit: '100mb',
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, stream: false };
    return config;
  },
};

export default nextConfig;
