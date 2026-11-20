import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { themeColors } from '@/lib/theme-colors';

// The link-preview image (see shareImage in src/lib/metadata.ts), drawn from the site name and theme
// at build time. Once there is real artwork, delete this folder and add public/og-image.png instead.
export const dynamic = 'force-static';

export function GET() {
  const { primary, primaryContainer, onPrimaryContainer } = themeColors.light;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 96,
        backgroundColor: primaryContainer,
        color: onPrimaryContainer,
        borderBottom: `24px solid ${primary}`,
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>{SITE_NAME}</div>
      <div style={{ marginTop: 32, fontSize: 36, lineHeight: 1.35, opacity: 0.85 }}>
        {SITE_DESCRIPTION.length > 140 ? `${SITE_DESCRIPTION.slice(0, 139)}…` : SITE_DESCRIPTION}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
