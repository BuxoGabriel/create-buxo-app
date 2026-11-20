import type { DaoError } from '@/types';

// A message that is safe to show to the user. Not server-only, so client components can use it.
export function renderError(error: DaoError): string {
  switch (error.type) {
    case 'auth-error':
      return 'Unauthorized';
    case 'database-error':
      return 'Could not retrieve data from database';
    case 'unexpected-error':
    default:
      return 'Unexpected error occurred';
  }
}
