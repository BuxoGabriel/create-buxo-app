import type { Metadata, Viewport } from 'next';
import './globals.css';
import Footer from '@/components/footer';
import JsonLd from '@/components/json-ld';
import Main from '@/components/main';
import Navbar from '@/components/navbar';
import { fontBody, fontBrand, fontUi } from '@/lib/fonts';
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata';
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, siteUrl } from '@/lib/site';
import { siteGraph } from '@/lib/structured-data';
import { themeColors } from '@/lib/theme-colors';
import { themeInitScript } from '@/lib/theme-mode';

// Site-wide defaults. Pages extend these through pageMetadata() in src/lib/metadata.ts.
// No canonical here: it would be inherited by routes that don't set their own and point them at "/".
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: AUTHOR_NAME ? [{ name: AUTHOR_NAME }] : undefined,
  creator: AUTHOR_NAME || SITE_NAME,
  publisher: SITE_NAME,
  keywords: SITE_KEYWORDS,
  robots: {
    index: true,
    follow: true,
    // Let search and AI overviews show large image previews and full-length snippets
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: { ...sharedOpenGraph, title: SITE_NAME, description: SITE_DESCRIPTION, url: '/' },
  twitter: { ...sharedTwitter, title: SITE_NAME, description: SITE_DESCRIPTION },
};

// Matches --md-surface so mobile browser chrome blends with the page
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themeColors.light.surface },
    { media: '(prefers-color-scheme: dark)', color: themeColors.dark.surface },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the script below may set data-theme before React hydrates
    <html
      lang="en"
      className={`${fontBrand.variable} ${fontUi.variable} ${fontBody.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-inverse-surface focus:px-6 focus:py-3 focus:type-label-lg focus:text-inverse-on-surface"
        >
          Skip to main content
        </a>
        <Navbar />
        <Main>{children}</Main>
        <Footer />
        <JsonLd data={siteGraph} />
      </body>
    </html>
  );
}
