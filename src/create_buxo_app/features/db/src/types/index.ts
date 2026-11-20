// Why a data-access call failed. Add a variant here (and a message in `renderError`) when callers
// need to tell another case apart, e.g. { type: 'not-found' }.
export type DaoError =
  { type: 'auth-error' } | { type: 'database-error' } | { type: 'unexpected-error' };

// What every data-access function returns: check `success` before touching `data`.
export type DaoResponse<T> = { success: true; data: T } | { success: false; error: DaoError };
