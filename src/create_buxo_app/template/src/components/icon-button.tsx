import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const iconButtonClasses =
  'state-layer inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl disabled:cursor-not-allowed disabled:opacity-40';

// The label is required: an icon alone has no accessible name.
type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  label: string;
};

export default function IconButton({
  label,
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(iconButtonClasses, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
