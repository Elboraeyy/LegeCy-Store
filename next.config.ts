import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // instrumentationHook: true, // Not needed in Next.js 15+? It is stable in 15? 
    // Checking docs... in 13.2 it was experimental. In 15 it might be stable.
    // Let's add it to be safe or if it's required.
    // Actually, usually it's auto-detected if file exists in src/
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
};

export default nextConfig;
