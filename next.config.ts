import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Cloud Run deployment
  output: 'standalone',
};

export default nextConfig;
