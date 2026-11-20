import NextLink from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// M3 common buttons. All variants keep a 48px minimum target.
export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

type ButtonStyleProps = {
  variant?: ButtonVariant;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary hover:shadow-elev-1',
  tonal: 'bg-secondary-container text-on-secondary-container',
  outlined: 'border border-outline text-primary',
  text: 'px-3 text-primary',
  danger: 'bg-error text-on-error hover:shadow-elev-1',
};

/** The button look as a class string, for elements that can't be a <Button> (e.g. a Radix trigger). */
export function buttonClasses({
  variant = 'filled',
  fullWidth,
}: Pick<ButtonStyleProps, 'variant' | 'fullWidth'> = {}) {
  return cn(
    'state-layer inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 type-label-lg whitespace-nowrap',
    'cursor-pointer transition-shadow duration-150 ease-standard',
    'disabled:cursor-not-allowed disabled:border-on-surface/12 disabled:bg-on-surface/12 disabled:text-on-surface/40 disabled:shadow-none',
    'aria-disabled:cursor-not-allowed aria-disabled:bg-on-surface/12 aria-disabled:text-on-surface/40 aria-disabled:shadow-none',
    variantClasses[variant],
    variant === 'text' && 'disabled:bg-transparent',
    fullWidth && 'w-full'
  );
}

function ButtonContent({
  icon,
  trailingIcon,
  children,
}: Pick<ButtonStyleProps, 'icon' | 'trailingIcon'> & { children?: ReactNode }) {
  return (
    <>
      {icon && (
        <span aria-hidden="true" className="-ml-1 inline-flex text-[1.25rem]">
          {icon}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span aria-hidden="true" className="-mr-1 inline-flex text-[1.25rem]">
          {trailingIcon}
        </span>
      )}
    </>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

export default function Button({
  variant,
  icon,
  trailingIcon,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClasses({ variant, fullWidth }), className)} {...rest}>
      <ButtonContent icon={icon} trailingIcon={trailingIcon}>
        {children}
      </ButtonContent>
    </button>
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonStyleProps & { href: string };

const isExternal = (href: string) => /^(https?:|tel:|mailto:)/.test(href);

/** A link styled as a button. Internal hrefs go through next/link, external ones render a plain <a>. */
export function LinkButton({
  href,
  variant,
  icon,
  trailingIcon,
  fullWidth,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const classes = cn(buttonClasses({ variant, fullWidth }), className);
  const content = (
    <ButtonContent icon={icon} trailingIcon={trailingIcon}>
      {children}
    </ButtonContent>
  );
  if (isExternal(href)) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <NextLink href={href} className={classes} {...rest}>
      {content}
    </NextLink>
  );
}
