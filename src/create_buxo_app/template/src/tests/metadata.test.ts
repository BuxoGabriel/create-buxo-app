import { describe, expect, test } from 'vitest';
import { type PageInfo, pageMetadata, shareImage } from '@/lib/metadata';
import { SITE_NAME } from '@/lib/site';

const PAGE = {
  title: 'Mock Page',
  description: 'Mock description',
  path: '/mock',
  keywords: ['mock', 'page'],
} satisfies PageInfo;

describe('pageMetadata', () => {
  test('carries the shared open graph and twitter fields onto the page', () => {
    expect(pageMetadata(PAGE)).toEqual({
      title: PAGE.title,
      description: PAGE.description,
      keywords: PAGE.keywords,
      alternates: { canonical: PAGE.path },
      openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'en_US',
        images: [shareImage],
        title: PAGE.title,
        description: PAGE.description,
        url: PAGE.path,
      },
      twitter: {
        card: 'summary_large_image',
        images: [shareImage],
        title: PAGE.title,
        description: PAGE.description,
      },
    });
  });

  test('absoluteTitle drops the site-name suffix', () => {
    expect(pageMetadata({ ...PAGE, absoluteTitle: true }).title).toEqual({ absolute: PAGE.title });
  });

  test('a page image replaces the share image in both previews', () => {
    const image = { url: '/mock.png', width: 800, height: 400, alt: 'Mock' };
    const metadata = pageMetadata({ ...PAGE, image });
    expect(metadata.openGraph?.images).toEqual([image]);
    expect(metadata.twitter?.images).toEqual([image]);
  });

  test('noindex keeps the page out of search but still followed', () => {
    expect(pageMetadata({ ...PAGE, noindex: true }).robots).toEqual({ index: false, follow: true });
    expect(pageMetadata(PAGE).robots).toBeUndefined();
  });
});
