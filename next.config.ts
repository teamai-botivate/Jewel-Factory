import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function nextConfig(phase: string): NextConfig {
  return {
    reactStrictMode: true,
    // Keep the dev server isolated from `next build`. Both commands otherwise
    // write to `.next`, so running a build while developing can remove manifests
    // and chunks that the live dev server still needs.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
    // Standalone output for Docker (self-contained server + correct static serving).
    // Enabled only when DOCKER_BUILD=1 so local Windows builds don't hit the
    // symlink permission error that `output:'standalone'` triggers on Windows.
    ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' as const } : {}),
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: 'res.cloudinary.com' },
        { protocol: 'https', hostname: 'images.unsplash.com' },
      ],
    },
  };
}
