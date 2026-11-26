import { redirect } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import { signInWithGoogleAction } from '@/actions/auth-actions';
import Button from '@/components/button';
import Container from '@/components/container';
import JsonLd from '@/components/json-ld';
import PageHeader from '@/components/page-header';
import { getSession, googleEnabled } from '@/lib/auth';
import { safeCallbackPath, SIGN_IN_PATH } from '@/lib/auth-redirect';
import { type PageInfo, pageMetadata } from '@/lib/metadata';
import { webPageLd } from '@/lib/structured-data';

const PAGE = {
  title: 'Sign in',
  description: 'Sign in to your account.',
  path: SIGN_IN_PATH,
  noindex: true,
} satisfies PageInfo;

export const metadata = pageMetadata(PAGE);

type SignInProps = { searchParams: Promise<{ callbackUrl?: string | string[] }> };

// Starter page: one button per sign-in method in src/lib/auth.ts.
export default async function SignIn({ searchParams }: SignInProps) {
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl);
  if (await getSession()) redirect(callbackUrl);

  return (
    <Container>
      <PageHeader title={PAGE.title} description={PAGE.description} />
      {googleEnabled ? (
        <form action={signInWithGoogleAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" icon={<FaGoogle />}>
            Continue with Google
          </Button>
        </form>
      ) : (
        <p className="type-body-lg text-on-surface-variant">
          No sign-in method is set up yet. See TODO.md.
        </p>
      )}
      <JsonLd data={webPageLd(PAGE)} />
    </Container>
  );
}
