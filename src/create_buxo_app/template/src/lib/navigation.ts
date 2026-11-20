export type NavLink = { href: string; label: string };
export type NavGroup = { label: string; children: NavLink[] };
export type NavItem = NavLink | NavGroup;

export const isNavGroup = (item: NavItem): item is NavGroup => 'children' in item;

// The one list the top bar, the mobile drawer, and the footer all read from.
// A group ({ label, children }) renders as a dropdown on desktop and a labelled section in the drawer.
export const navItems: NavItem[] = [{ href: '/styleguide', label: 'Styleguide' }];

/** Every link in navItems with groups flattened, e.g. for the footer. */
export function flatNavLinks(items: NavItem[] = navItems): NavLink[] {
  return items.flatMap((item) => (isNavGroup(item) ? item.children : [item]));
}

export function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
}
