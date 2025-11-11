import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use static export for Firebase Hosting
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
