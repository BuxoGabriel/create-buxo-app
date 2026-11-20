import 'server-only';
import type { DaoError, DaoResponse } from '@/types';

// Response and request wrappers for data-access (DAO) functions. They don't care which database or
// ORM is behind them: a DAO function runs its query inside the callback and returns a DaoResponse.
//
//   export async function getPosts(): Promise<DaoResponse<Post[]>> {
//     return await dbTryCatchResponseWrapper(async () => {
//       const posts = await db.select().from(postsTable);
//       return createDaoSuccess(posts);
//     })();
//   }

export function createDaoSuccess<T>(data: T): DaoResponse<T> {
  return { success: true, data };
}

export function createDaoError(error: DaoError): DaoResponse<never> {
  return { success: false, error };
}

// Request wrapper: anything the callback throws is logged and becomes a 'database-error' response,
// so DAO functions never throw at their callers.
export function dbTryCatchResponseWrapper<T>(
  callback: () => Promise<DaoResponse<T>>
): () => Promise<DaoResponse<T>> {
  return async () => {
    try {
      return await callback();
    } catch (error) {
      console.error(error);
      return createDaoError({ type: 'database-error' });
    }
  };
}
