import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { siteUrl } from './site';

const SESSION_DURATION = 24 * 60 * 60; // seconds

// Google sign-in is offered only when its OAuth client is configured.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
export const googleEnabled = Boolean(googleClientId && googleClientSecret);

// The hosts this site answers on: the production domain (localhost in development) and, on Vercel,
// the preview deployment's own addresses. Sign-in callbacks go back to whichever one the visitor
// is on; a request for any other host is answered as the production site.
const allowedHosts = [siteUrl.host, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(
  (host): host is string => Boolean(host)
);

// BETTER_AUTH_SECRET is read from the environment. In production nothing here works without it.
function createAuth() {
  return betterAuth({
    // BETTER_AUTH_URL, when set, pins the site to one origin (needed off Vercel).
    baseURL: process.env.BETTER_AUTH_URL || {
      allowedHosts,
      fallback: siteUrl.origin,
      protocol: siteUrl.protocol === 'https:' ? 'https' : 'http',
    },
    // No `database`: the session lives in an encrypted cookie and nothing is stored on the server.
    // Add a database here (see TODO.md) to keep users, or to be able to end a session early.
    session: {
      expiresIn: SESSION_DURATION,
    },
    socialProviders: {
      ...(googleEnabled && {
        google: { clientId: googleClientId!, clientSecret: googleClientSecret! },
      }),
      // TODO: add the providers this site needs (see TODO.md)
    },
    // Lets server actions set cookies. Keep it last in the list.
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;

/** The Better Auth instance, created on first use so the site builds before the secret is set. */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}

export type Session = Auth['$Infer']['Session'];

// TODO: return false to turn an account away, e.g. an email that is not on your list.
// As scaffolded, anyone who gets through a provider is signed in.
function mayUseSite(user: Session['user']): boolean {
  return Boolean(user);
}

/**
 * The signed-in user's session, or null. Call it in every page, server action and route handler
 * that reads or changes private data: `src/proxy.ts` only looks for a cookie.
 */
export async function getSession(): Promise<Session | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !mayUseSite(session.user)) return null;
  return session;
}
