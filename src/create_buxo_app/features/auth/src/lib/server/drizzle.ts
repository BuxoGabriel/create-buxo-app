import 'server-only';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

export type Db = NodePgDatabase<typeof schema>;

type DbGlobal = { appPool?: Pool; appDb?: Db };
const globalForDb = globalThis as typeof globalThis & DbGlobal;

/**
 * The database client. Nothing connects until the first call, so `pnpm build` and pages that do
 * not touch the database work without DATABASE_URL.
 */
export function getDb(): Db {
  if (globalForDb.appDb) return globalForDb.appDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  // An idle connection that errors (the server closed it, say) must not crash the process.
  pool.on('error', (error) => console.error('Postgres pool error', error));
  const db = drizzle({ client: pool, schema });

  // Kept on globalThis so development hot reloads reuse the pool instead of opening a new one.
  globalForDb.appPool = pool;
  globalForDb.appDb = db;
  return db;
}
