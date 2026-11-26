import { describe, expect, test } from 'vitest';
import { safeCallbackPath } from '@/lib/auth-redirect';

describe('safeCallbackPath', () => {
  test('keeps a path on this site, with its query', () => {
    expect(safeCallbackPath('/account')).toBe('/account');
    expect(safeCallbackPath('/account/orders?page=2')).toBe('/account/orders?page=2');
  });

  test('sends anything that could leave the site to the home page', () => {
    for (const value of [
      'https://example.com',
      '//example.com',
      '/\\example.com',
      'account',
      'javascript:alert(1)',
      '',
    ]) {
      expect(safeCallbackPath(value), value).toBe('/');
    }
  });

  test('sends a missing or repeated parameter to the home page', () => {
    expect(safeCallbackPath(undefined)).toBe('/');
    expect(safeCallbackPath(null)).toBe('/');
    expect(safeCallbackPath(['/a', '/b'])).toBe('/');
  });

  test('never comes back to the sign-in page itself', () => {
    expect(safeCallbackPath('/sign-in')).toBe('/');
    expect(safeCallbackPath('/sign-in?callbackUrl=/account')).toBe('/');
  });
});
