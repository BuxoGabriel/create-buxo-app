import Link from 'next/link';
import { flatNavLinks } from '@/lib/navigation';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import Container from './container';

const footerLinks = [{ href: '/', label: 'Home' }, ...flatNavLinks()];

export default function Footer() {
  return (
    <footer className="mt-24 bg-surface-container text-on-surface-variant">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-md">
            <p className="type-brand text-2xl text-on-surface">{SITE_NAME}</p>
            <p className="mt-2 type-body-md">{SITE_DESCRIPTION}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 sm:grid-cols-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-12 items-center type-body-md text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-outline-variant pt-6 type-body-sm sm:flex-row sm:justify-between">
          {/* Rendered at build time, so the year updates with the first deploy of each year */}
          <p>
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
          <p>
            Built by{' '}
            <a href="https://buxogabriel.dev" className="text-primary underline underline-offset-4">
              Buxo Webdev
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
