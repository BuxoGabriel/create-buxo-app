import { describe, expect, test, vi } from 'vitest';
import { renderError } from '@/lib/dao-error';
import { createDaoError, createDaoSuccess, dbTryCatchResponseWrapper } from '@/lib/server/db';

// 'server-only' throws when imported outside a server component, which includes the test runner.
vi.mock('server-only', () => ({}));

describe('db wrappers', () => {
  test('createDaoSuccess and createDaoError build the two response states', () => {
    expect(createDaoSuccess([1, 2])).toEqual({ success: true, data: [1, 2] });
    expect(createDaoError({ type: 'auth-error' })).toEqual({
      success: false,
      error: { type: 'auth-error' },
    });
  });

  test('dbTryCatchResponseWrapper passes the callback response through', async () => {
    const response = await dbTryCatchResponseWrapper(async () => createDaoSuccess('ok'))();
    expect(response).toEqual({ success: true, data: 'ok' });
  });

  test('dbTryCatchResponseWrapper turns a throw into a database-error', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await dbTryCatchResponseWrapper<string>(async () => {
      throw new Error('connection refused');
    })();
    expect(response).toEqual({ success: false, error: { type: 'database-error' } });
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  test('renderError has a message for every error type', () => {
    expect(renderError({ type: 'auth-error' })).toBe('Unauthorized');
    expect(renderError({ type: 'database-error' })).toMatch(/database/);
    expect(renderError({ type: 'unexpected-error' })).toMatch(/Unexpected/);
  });
});
