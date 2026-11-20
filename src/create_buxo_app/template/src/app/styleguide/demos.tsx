'use client';

import { useState } from 'react';
import Button from '@/components/button';
import ConfirmDialog from '@/components/dialog';
import FilterChip from '@/components/filter-chip';

const CHIPS = ['Design', 'Build', 'Launch'];

export function FilterChipDemo() {
  const [selected, setSelected] = useState<string[]>(['Build']);
  const toggle = (chip: string) =>
    setSelected((current) =>
      current.includes(chip) ? current.filter((c) => c !== chip) : [...current, chip]
    );
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <FilterChip key={chip} selected={selected.includes(chip)} onClick={() => toggle(chip)}>
          {chip}
        </FilterChip>
      ))}
    </div>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ConfirmDialogDemo() {
  const [deleted, setDeleted] = useState(0);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ConfirmDialog
        trigger={<Button variant="outlined">Delete something</Button>}
        title="Delete this item?"
        description="This is a demo: nothing is deleted. The action takes a second, like a server action would."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          await wait(1000);
          setDeleted((count) => count + 1);
        }}
      />
      <ConfirmDialog
        trigger={<Button variant="text">An action that fails</Button>}
        title="Try something that fails?"
        description="The action throws, so the dialog stays open and shows the message."
        onConfirm={async () => {
          await wait(600);
          throw new Error('The server said no. Try again later.');
        }}
      />
      <p aria-live="polite" className="type-body-sm text-on-surface-variant">
        Deleted {deleted} {deleted === 1 ? 'time' : 'times'}
      </p>
    </div>
  );
}
