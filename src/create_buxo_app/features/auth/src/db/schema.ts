// The database schema. `pnpm db:generate` turns a change here into a SQL migration in `drizzle/`,
// and `pnpm db:migrate` applies it. Never edit a migration that has already been applied anywhere.
//
// Loaded by drizzle-kit outside Next: relative imports only, and nothing that is `server-only`.
export * from './auth-schema';

// TODO: add this site's own tables below. New tables get `.enableRLS()`, which keeps them closed
// to the host's public data API if that is ever switched on.
