import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Everything is crawlable, AI crawlers included. Keep single pages out with `noindex` in their PageInfo.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
