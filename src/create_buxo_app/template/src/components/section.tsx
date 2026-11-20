import { type HTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';

type SectionProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title?: ReactNode;
  description?: ReactNode;
};

// A titled block of a page. The heading labels the region; scroll-mt keeps it clear of the sticky bar
// when linked to by id.
export default function Section({
  title,
  description,
  className,
  children,
  ...rest
}: SectionProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cn('scroll-mt-20 py-8 sm:py-10', className)}
      {...rest}
    >
      {title && (
        <h2 id={headingId} className="type-headline-sm">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-2 max-w-[68ch] type-body-md text-on-surface-variant">{description}</p>
      )}
      <div className={cn((title || description) && 'mt-6')}>{children}</div>
    </section>
  );
}
