import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type TagProps = PropsWithChildren<{
  tone?: 'neutral' | 'primary' | 'secondary' | 'error';
  className?: string;
}>;

const toneClasses = {
  neutral: 'bg-surface-container-high text-on-surface-variant',
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  error: 'bg-error-container text-on-error-container',
};

// Non-interactive label. Deliberately flat so it never reads as a button.
export default function Tag({ tone = 'neutral', className, children }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-xs px-2 py-0.5 type-label-md',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
