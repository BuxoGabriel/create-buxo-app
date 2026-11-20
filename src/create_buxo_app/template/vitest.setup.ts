import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals are off (tests import from 'vitest'), so Testing Library can't register this itself.
afterEach(() => {
  cleanup();
});
