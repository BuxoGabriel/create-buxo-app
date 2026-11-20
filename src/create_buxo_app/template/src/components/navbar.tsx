import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';
import NavDrawer from './nav-drawer';
import NavLinks from './nav-links';
import ThemeToggle from './theme-toggle';
import TopAppBar from './top-app-bar';

// Links come from src/lib/navigation.ts.
export default function Navbar() {
  return (
    <TopAppBar>
      <div className="mx-auto flex h-16 max-w-360 items-center gap-2 px-2 sm:px-4 lg:px-6">
        <Link
          href="/"
          className="state-layer flex min-h-12 items-center rounded-full px-3 type-brand text-2xl leading-none whitespace-nowrap"
        >
          {SITE_NAME}
        </Link>
        <div className="ml-auto flex items-center gap-1 lg:gap-2">
          <NavLinks />
          <ThemeToggle />
          <NavDrawer />
        </div>
      </div>
    </TopAppBar>
  );
}
