import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Dev proxy to FastAPI can exceed default limits when Ollama is slow; keep API responsive via backend fallbacks too.
  experimental: {
    proxyTimeout: 120_000,
  },
  async redirects() {
    return [
      { source: "/memory-proof", destination: "/ask", permanent: false },
      { source: "/family-tree", destination: "/family", permanent: false },
      { source: "/life-map", destination: "/family", permanent: false },
      { source: "/life-chapters", destination: "/stories", permanent: false },
      { source: "/trust", destination: "/settings", permanent: false },
      { source: "/dashboard", destination: "/studio", permanent: false },
      { source: "/story-companion", destination: "/settings", permanent: false },
      { source: "/presence", destination: "/settings", permanent: false },
      { source: "/care", destination: "/settings", permanent: false },
      { source: "/legacy-tree", destination: "/settings", permanent: false },
      { source: "/legacy-contacts", destination: "/settings", permanent: false },
      { source: "/family-rituals", destination: "/settings", permanent: false },
      { source: "/messages", destination: "/ask", permanent: false },
      { source: "/storyboards", destination: "/stories", permanent: false },
      { source: "/reports", destination: "/stories", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  /* Optimize for network drive performance */
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  /* Use filesystem caching efficiently */
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
