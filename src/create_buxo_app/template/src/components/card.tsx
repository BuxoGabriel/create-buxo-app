import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'filled' | 'elevated' | 'outlined';

const variantClasses: Record<CardVariant, string> = {
  filled: 'bg-surface-container-highest',
  elevated: 'bg-surface-container-low shadow-elev-1',
  outlined: 'border-outline-variant bg-surface border',
};

type CardProps = {
  title: ReactNode;
  /** Makes the whole card one link (the title is the link; its hit area is stretched over the card) */
  href?: string;
  variant?: CardVariant;
  /** Heading level of the title, to fit the page outline */
  headingLevel?: 2 | 3 | 4;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

// M3 card.
export default function Card({
  title,
  href,
  variant = 'filled',
  headingLevel = 3,
  icon,
  className,
  children,
}: CardProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article
      className={cn(
        'rounded-md p-5 text-on-surface',
        variantClasses[variant],
        href && 'state-layer-within',
        className
      )}
    >
      {icon && (
        <span aria-hidden="true" className="mb-3 inline-flex text-3xl text-primary">
          {icon}
        </span>
      )}
      <Heading className="type-title-lg">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 after:rounded-md">
            {title}
          </Link>
        ) : (
          title
        )}
      </Heading>
      {children && <div className="mt-2 type-body-md text-on-surface-variant">{children}</div>}
    </article>
  );
}
