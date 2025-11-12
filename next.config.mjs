/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firebase App Hosting supports full Next.js features
  // Enable standalone output for Docker builds (if using Dockerfile)
  output: 'standalone',
  // Ensure proper error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;

