import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/features',
    '/how-it-works',
    '/pricing',
    '/about',
    '/privacy',
    '/security',
    '/contact',
    '/feedback',
    '/local-ai',
    '/families',
    '/data-ownership',
    '/terms',
    '/auth/login',
    '/auth/register',
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/auth') ? 0.5 : 0.7,
  }));
}
