import type { Metadata } from 'next';
import { SITE_NAME } from './site';

// Next merges metadata shallowly: a page's `openGraph` or `twitter` object replaces the layout's whole object.
// Every page builds its metadata here so the shared fields are never dropped.
// The share image is referenced here rather than as app/opengraph-image for the same reason: a file-based
// image is dropped on any page that sets its own openGraph. 1200×630 (1.91:1) suits X, Slack, Discord, and
// Facebook. It is rendered by src/app/og-image.png/route.tsx; replace that route with public/og-image.png
// once there is real artwork.
export const shareImage = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: SITE_NAME,
};

type ShareImage = { url: string; width?: number; height?: number; alt?: string };

export const sharedOpenGraph = {
  type: 'website',
  siteName: SITE_NAME,
  locale: 'en_US',
  images: [shareImage],
} satisfies Metadata['openGraph'];

export const sharedTwitter = {
  card: 'summary_large_image',
  images: [shareImage],
} satisfies Metadata['twitter'];

export type PageInfo = {
  /** Shown before the " | Site Name" suffix in the tab; used alone in link previews */
  title: string;
  /** 110–160 characters: search snippets and link previews truncate past that */
  description: string;
  /** Route path, e.g. "/about". Becomes the canonical and og:url, resolved against metadataBase */
  path: string;
  keywords?: string[];
  /** Use `title` as the full tab title, without the site-name suffix */
  absoluteTitle?: boolean;
  /** Page-specific link-preview image. Defaults to the site share image */
  image?: ShareImage;
  /** Keep the page out of search results (e.g. unfinished pages) */
  noindex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  absoluteTitle,
  image,
  noindex,
}: PageInfo): Metadata {
  const images = image ? [image] : [shareImage];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: { ...sharedOpenGraph, title, description, url: path, images },
    twitter: { ...sharedTwitter, title, description, images },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}
