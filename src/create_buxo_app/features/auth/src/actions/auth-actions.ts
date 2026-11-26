'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { safeCallbackPath } from '@/lib/auth-redirect';

// Starts Google sign-in and comes back to `callbackUrl` (a path on this site). Use it as a form
// action, as src/app/sign-in/page.tsx does. Copy it for each provider you add.
export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const { url } = await getAuth().api.signInSocial({
    body: { provider: 'google', callbackURL: safeCallbackPath(formData.get('callbackUrl')) },
  });
  if (!url) throw new Error('The sign-in provider did not return a URL');

  redirect(url);
}

// Signs the visitor out and sends them home:
//
//   <form action={signOutAction}>
//     <Button type="submit">Sign out</Button>
//   </form>
export async function signOutAction(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });

  redirect('/');
}
