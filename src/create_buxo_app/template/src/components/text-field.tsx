import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: ReactNode;
  /** Helper text under the field */
  hint?: ReactNode;
  /** Error text; also marks the field invalid */
  error?: ReactNode;
};

// Outlined text field with a visible label. Hint and error are tied to the input for screen readers.
// For a <textarea> or <select>, reuse the `field` and `field-label` utilities from globals.css.
export default function TextField({ label, hint, error, className, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = cn(hint && hintId, error && errorId) || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="type-body-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="message-error">
          {error}
        </p>
      )}
    </div>
  );
}
