export const SIGN_IN_PATH = '/sign-in';

/**
 * Where to send someone after signing in. Only a path on this site is accepted, so a crafted
 * sign-in link cannot forward a visitor to another site. Anything else becomes the home page.
 */
export function safeCallbackPath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  // "//host" and "/\host" are read by browsers as another site
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  if (value === SIGN_IN_PATH || value.startsWith(`${SIGN_IN_PATH}?`)) return '/';
  return value;
}
