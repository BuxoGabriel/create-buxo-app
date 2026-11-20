'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { MdExpandMore } from 'react-icons/md';
import { type NavGroup, isActivePath, isNavGroup, navItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const itemClasses = cn(
  'state-layer relative inline-flex min-h-12 items-center gap-1 rounded-full px-3 type-label-lg',
  // Active indicator sits under the label; ::before is taken by the state layer
  'after:absolute after:inset-x-3 after:bottom-1.5 after:h-[3px] after:rounded-full after:bg-current after:opacity-0',
  'aria-[current=page]:after:opacity-100 data-[active=true]:after:opacity-100'
);

// Desktop navigation (lg and up). Below that, <NavDrawer> takes over.
export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {navItems.map((item) => (
          <li key={item.label}>
            {isNavGroup(item) ? (
              <NavMenu group={item} pathname={pathname} />
            ) : (
              <Link
                href={item.href}
                className={itemClasses}
                aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Disclosure-pattern menu (a button that shows a list of links), not an ARIA menu widget.
function NavMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = group.children.some((child) => isActivePath(pathname, child.href));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={cn(itemClasses, 'cursor-pointer')}
        aria-expanded={open}
        aria-controls={panelId}
        data-active={active}
        onClick={() => setOpen((o) => !o)}
      >
        {group.label}
        <MdExpandMore
          aria-hidden="true"
          className={cn(
            'size-5 transition-transform duration-150 ease-standard',
            open && 'rotate-180'
          )}
        />
      </button>
      <ul
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 mt-1 min-w-48 rounded-sm bg-surface-container-high py-2 text-on-surface shadow-elev-3"
      >
        {group.children.map((child) => (
          <li key={child.href}>
            <Link
              href={child.href}
              onClick={() => setOpen(false)}
              className="state-layer flex min-h-12 items-center px-4 type-label-lg aria-[current=page]:bg-secondary-container aria-[current=page]:text-on-secondary-container"
              aria-current={isActivePath(pathname, child.href) ? 'page' : undefined}
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
