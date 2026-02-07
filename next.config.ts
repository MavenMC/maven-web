import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    qualities: [100, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minotar.net',
        pathname: '/helm/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/embed/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'crafatar.com',
        pathname: '/renders/head/**',
      },
      {
        protocol: 'https',
        hostname: 'www.minecraft.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mc-heads.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
