import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const SESSION_DURATION = 24 * 60 * 60; // seconds

// Google sign-in is offered only when its OAuth client is configured
// (the provider reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET on its own).
const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    // No database adapter: the session lives in a signed cookie
    strategy: 'jwt',
    maxAge: SESSION_DURATION,
  },
  providers: [
    ...(googleEnabled ? [Google] : []),
    // TODO: add the providers this site needs (see TODO.md), e.g. Credentials for username/password
  ],
  callbacks: {
    // TODO: return false here to reject sign-ins, e.g. emails that have no account in your database
    async signIn() {
      return true;
    },
    // Copy what the app needs from the token to the session. Add roles here once you have them.
    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
