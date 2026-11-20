import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from '@/lib/site';
import { themeColors } from '@/lib/theme-colors';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: themeColors.light.surface,
    theme_color: themeColors.light.surface,
    // src/app/icon.svg is a generated placeholder. Add 192px and 512px PNGs here with the real logo.
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
