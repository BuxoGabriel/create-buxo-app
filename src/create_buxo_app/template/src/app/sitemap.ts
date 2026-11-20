import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Public, indexable pages only. Hand-maintained: add a route here when you add a page.
// Left out: /styleguide (noindex).
const routes = ['/'];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({ url: absoluteUrl(route) }));
}
