import { describe, expect, test } from 'vitest';
import { flatNavLinks, isActivePath, isNavGroup, type NavItem } from '@/lib/navigation';

const ITEMS: NavItem[] = [
  { href: '/about', label: 'About' },
  {
    label: 'Services',
    children: [
      { href: '/services/design', label: 'Design' },
      { href: '/services/build', label: 'Build' },
    ],
  },
];

describe('navigation', () => {
  test('isNavGroup tells groups from links', () => {
    expect(ITEMS.map(isNavGroup)).toEqual([false, true]);
  });

  test('flatNavLinks flattens groups in order', () => {
    expect(flatNavLinks(ITEMS).map((link) => link.href)).toEqual([
      '/about',
      '/services/design',
      '/services/build',
    ]);
  });

  test('isActivePath matches the page and its children, but home only exactly', () => {
    expect(isActivePath('/about', '/about')).toBe(true);
    expect(isActivePath('/about/team', '/about')).toBe(true);
    expect(isActivePath('/about-us', '/about')).toBe(false);
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/about', '/')).toBe(false);
  });
});
