import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Small label above the title, e.g. a section name */
  eyebrow?: ReactNode;
  className?: string;
};

// The one <h1> of a page.
export default function PageHeader({ title, description, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn('pt-10 pb-8 sm:pt-14 sm:pb-10', className)}>
      {eyebrow && <p className="mb-2 type-label-lg text-primary">{eyebrow}</p>}
      <h1 className="type-headline-lg">{title}</h1>
      {description && (
        <p className="mt-4 max-w-[68ch] type-body-lg text-on-surface-variant">{description}</p>
      )}
    </header>
  );
}
