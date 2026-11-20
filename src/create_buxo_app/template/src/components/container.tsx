import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Page-width wrapper: 16 / 24 / 32px margins, 72rem max content width.
export default function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)} {...rest} />
  );
}
