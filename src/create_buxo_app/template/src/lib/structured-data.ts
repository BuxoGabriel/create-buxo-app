import type { PageInfo } from './metadata';
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from './site';

// schema.org JSON-LD. The root layout emits the Organization and WebSite once;
// each page emits its own WebPage that points back to them by @id.
// Swap "Organization" for "Person" (and add sameAs profile links) on a personal site.
const ORGANIZATION_ID = absoluteUrl('/#organization');
const WEBSITE_ID = absoluteUrl('/#website');

export const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: SITE_DESCRIPTION,
      logo: absoluteUrl('/icon.svg'),
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: SITE_DESCRIPTION,
      inLanguage: 'en-US',
      publisher: { '@id': ORGANIZATION_ID },
    },
  ],
};

type WebPageType = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';

export function webPageLd(
  { title, description, path }: PageInfo,
  type: WebPageType = 'WebPage',
  extra: Record<string, unknown> = {}
) {
  const url = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    ...(path !== '/' && {
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: title, item: url },
        ],
      },
    }),
    ...extra,
  };
}
