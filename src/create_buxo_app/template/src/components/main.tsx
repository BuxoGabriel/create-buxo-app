import type { PropsWithChildren } from 'react';

export default function Main({ children }: PropsWithChildren) {
  // tabIndex lets the skip link in the root layout move focus here
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-clip outline-none">
      {children}
    </main>
  );
}
