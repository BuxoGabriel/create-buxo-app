import type { ButtonHTMLAttributes } from 'react';
import { MdCheck } from 'react-icons/md';
import { cn } from '@/lib/utils';

// M3 filter chip: selection shown by fill + check icon + aria-pressed, never color alone.
export function filterChipClasses(selected: boolean, className?: string) {
  return cn(
    'state-layer inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-sm px-4 text-left type-label-lg transition-colors duration-150 ease-standard',
    selected
      ? 'bg-primary-container text-on-primary-container'
      : 'border border-outline text-on-surface-variant',
    className
  );
}

type FilterChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  selected: boolean;
};

export default function FilterChip({ selected, className, children, ...rest }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={filterChipClasses(selected, className)}
      {...rest}
    >
      {selected && <MdCheck aria-hidden="true" className="-ml-1 size-5 shrink-0" />}
      {children}
    </button>
  );
}
