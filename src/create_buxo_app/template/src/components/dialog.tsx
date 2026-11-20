'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog';
import { type ReactNode, useState, useTransition } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { cn } from '@/lib/utils';
import Button from './button';

// Shared M3 dialog classes for Radix Dialog parts, for building other dialogs.
export const dialogOverlayClasses =
  'bg-scrim/40 fixed inset-0 z-50 data-[state=closed]:animate-[fade-out_200ms_var(--ease-standard)] data-[state=open]:animate-[fade-in_250ms_var(--ease-standard)]';

export const dialogContentClasses =
  'bg-surface-container-high text-on-surface shadow-elev-3 fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-6 data-[state=closed]:animate-[dialog-out_150ms_var(--ease-standard)] data-[state=open]:animate-[dialog-in_250ms_var(--ease-emphasized-decelerate)]';

export const dialogTitleClasses = 'type-headline-sm text-on-surface';

export const dialogDescriptionClasses = 'type-body-md text-on-surface-variant';

type ConfirmDialogProps = {
  /** The element that opens the dialog, usually a <Button> */
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive */
  danger?: boolean;
  /** May be async (e.g. a server action). The dialog stays open while it runs and closes when it
   * resolves; if it throws, the error message is shown and the dialog stays open. */
  onConfirm: () => void | Promise<void>;
};

// "Are you sure?" dialog. Radix provides the focus trap, Escape handling, and focus return.
export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  danger = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        await onConfirm();
        setOpen(false);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'
        );
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Don't let Escape or an outside click abandon an action that is still running
        if (isPending) return;
        setOpen(nextOpen);
        if (!nextOpen) setError(undefined);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogPortal>
        <DialogOverlay className={dialogOverlayClasses} />
        <DialogContent className={cn(dialogContentClasses, 'max-w-lg')}>
          <div className="flex flex-col gap-2">
            <DialogTitle className={dialogTitleClasses}>{title}</DialogTitle>
            <DialogDescription className={dialogDescriptionClasses}>
              {description}
            </DialogDescription>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-sm bg-error-container px-4 py-3 type-body-sm text-on-error-container"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-row justify-end gap-2">
            <DialogClose asChild>
              <Button variant="text" disabled={isPending}>
                {cancelLabel}
              </Button>
            </DialogClose>
            <Button
              variant={danger ? 'danger' : 'filled'}
              onClick={confirm}
              disabled={isPending}
              icon={
                isPending ? (
                  <AiOutlineLoading3Quarters className="motion-safe:animate-spin" />
                ) : undefined
              }
            >
              {isPending ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
