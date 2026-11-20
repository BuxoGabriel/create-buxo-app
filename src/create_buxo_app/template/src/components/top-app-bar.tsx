'use client';

import { type PropsWithChildren, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}
const isScrolled = () => window.scrollY > 0;
const isScrolledOnServer = () => false;

// Sticky M3 small top app bar; gains elevation once the page has scrolled.
export default function TopAppBar({ children }: PropsWithChildren) {
  const scrolled = useSyncExternalStore(subscribe, isScrolled, isScrolledOnServer);
  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-primary-container text-on-primary-container transition-shadow duration-250 ease-standard',
        scrolled && 'shadow-elev-2'
      )}
    >
      {children}
    </header>
  );
}
