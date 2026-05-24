import type { NextConfig } from 'next';
import path from 'node:path';

const defaultImageHosts = [
  { protocol: 'http' as const, hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
  { protocol: 'http' as const, hostname: '127.0.0.1', port: '5000', pathname: '/uploads/**' },
];

const apiImagePatterns = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!raw) {
    return defaultImageHosts;
  }

  try {
    const apiOrigin = new URL(raw.replace(/\/api\/?$/, ''));
    const protocol = apiOrigin.protocol.replace(':', '') as 'http' | 'https';

    return [
      ...defaultImageHosts,
      {
        protocol,
        hostname: apiOrigin.hostname,
        port: apiOrigin.port || undefined,
        pathname: '/uploads/**',
      },
    ];
  } catch {
    return defaultImageHosts;
  }
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: apiImagePatterns(),
  },
  outputFileTracingRoot: path.join(process.cwd(), '..'),
  reactStrictMode: true,
};

export default nextConfig;
