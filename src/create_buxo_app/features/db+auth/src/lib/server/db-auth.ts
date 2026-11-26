import 'server-only';
import { getSession } from '@/lib/auth';
import type { DaoResponse } from '@/types';
import { createDaoError } from './db';

// Request wrapper: only runs the callback for a signed-in user, otherwise answers 'auth-error'.
// Put it outside the try/catch wrapper:
//
//   return await dbAuthWrapper(dbTryCatchResponseWrapper(async () => { ... }))();
//
// Checking here, in the data layer, protects the data even when a page or action forgets to.
export function dbAuthWrapper<T>(
  callback: () => Promise<DaoResponse<T>>
): () => Promise<DaoResponse<T>> {
  return async () => {
    const session = await getSession();
    if (!session) return createDaoError({ type: 'auth-error' });
    // TODO: once users have roles, check them here (e.g. take a `role` argument and compare it)
    return await callback();
  };
}
