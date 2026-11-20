'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MdClose, MdMenu } from 'react-icons/md';
import { type NavLink, isActivePath, isNavGroup, navItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { iconButtonClasses } from './icon-button';

// Modal navigation drawer for widths below lg, where <NavLinks> is hidden.
// Radix Dialog provides the focus trap, Escape handling, and focus return.
export default function NavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(iconButtonClasses, 'lg:hidden')}
        aria-label="Open navigation menu"
      >
        <MdMenu aria-hidden="true" />
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-40 bg-scrim/40 data-[state=closed]:animate-[fade-out_200ms_var(--ease-standard)] data-[state=open]:animate-[fade-in_250ms_var(--ease-standard)]" />
        <DialogContent
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-[min(22.5rem,88vw)] flex-col overflow-y-auto rounded-l-xl bg-surface-container-low p-3 text-on-surface shadow-elev-3',
            'data-[state=closed]:animate-[drawer-out_200ms_var(--ease-standard)] data-[state=open]:animate-[drawer-in_350ms_var(--ease-emphasized-decelerate)]'
          )}
        >
          <div className="flex items-center justify-between pl-4">
            <DialogTitle className="type-title-md text-on-surface-variant">Menu</DialogTitle>
            <DialogClose className={iconButtonClasses} aria-label="Close navigation menu">
              <MdClose aria-hidden="true" />
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">Site navigation</DialogDescription>
          <nav aria-label="Main" className="mt-2">
            <ul className="flex flex-col">
              <DrawerLink
                link={{ href: '/', label: 'Home' }}
                pathname={pathname}
                onNavigate={close}
              />
              {navItems.map((item) =>
                isNavGroup(item) ? (
                  <li key={item.label} className="mt-2 border-t border-outline-variant pt-2">
                    <p className="px-4 py-3 type-title-md text-on-surface-variant">{item.label}</p>
                    <ul>
                      {item.children.map((child) => (
                        <DrawerLink
                          key={child.href}
                          link={child}
                          pathname={pathname}
                          onNavigate={close}
                        />
                      ))}
                    </ul>
                  </li>
                ) : (
                  <DrawerLink key={item.href} link={item} pathname={pathname} onNavigate={close} />
                )
              )}
            </ul>
          </nav>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

type DrawerLinkProps = { link: NavLink; pathname: string; onNavigate: () => void };

function DrawerLink({ link, pathname, onNavigate }: DrawerLinkProps) {
  const active = isActivePath(pathname, link.href);
  return (
    <li>
      <Link
        href={link.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'state-layer flex min-h-14 items-center rounded-full px-4 type-label-lg',
          active && 'bg-secondary-container text-on-secondary-container'
        )}
      >
        {link.label}
      </Link>
    </li>
  );
}
