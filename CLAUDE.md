# CLAUDE.md

`create-buxo-app` is a Python CLI that scaffolds a Next.js + TypeScript + Tailwind site (pnpm,
Material 3 theme, Vitest, CI) and sets up its git/GitHub repo. README.md is the full reference; this
is what to know before changing things.

## Commands

- `uv run pytest` — tests for the tool (fast, no network, no pnpm)
- `uv run create-buxo-app <dir> --yes [--stripe --auth --db]` — scaffold from the working copy
- In a scaffolded project: `pnpm check && pnpm build` — the only real test of a template change

There are two languages here: the tool is Python (`uv`, never pip), the template is a pnpm project
(never npm).

CI (`.github/workflows/ci.yml`) runs pytest on Python 3.11 and 3.13, then scaffolds the base project,
each feature alone, and all three together, and runs `pnpm check`, `pnpm theme --check`, and
`pnpm build` in each. A new feature needs a row in its `scaffold` matrix.

## Layout

- `src/create_buxo_app/cli.py` — argparse flags, questionary prompts, and the subprocess steps
  (pnpm install, theme, prettier, git, gh). `gather()` builds a `Plan`, `execute()` runs it.
- `src/create_buxo_app/scaffold.py` — pure rendering: `ProjectOptions`, `_tokens()`,
  `write_project()`. No prompts, no subprocesses, so it is what the tests exercise.
- `src/create_buxo_app/features.py` — the optional boilerplate (`stripe`, `auth`, `db`): each
  feature's dependencies, env vars, README rows, and TODO.md checklist, plus `COMBOS` for pairs.
- `src/create_buxo_app/template/` — the base project, copied as is.
- `src/create_buxo_app/features/<key>/` — files a feature lays over the template.
  `features/db+auth/` is only added when both are picked.
- `tests/test_scaffold.py` — everything is tested through `write_project()` and `main()`.

## Rules

- Template naming: `dot_name` becomes `.name`; files ending `.tmpl` get `__TOKEN__` placeholders
  replaced (an unknown token raises) and lose the suffix; everything else is copied byte for byte.
  A new token must be added to `_tokens()`.
- Template and feature files must already be Prettier-clean (2 spaces, single quotes, semicolons,
  100 columns), because `--no-install` projects are committed exactly as stored. This includes
  generated Markdown: tables need padded columns (`_file_table()` in `features.py` does it).
  To check: scaffold with `--no-install`, symlink `node_modules` from an installed scaffold, run
  `pnpm exec prettier --check .`.
- A project scaffolded with no features must stay byte-identical to the base template output
  (`test_no_features_adds_nothing`). Feature-specific content goes in `features.py` or
  `features/`, never into the base template behind a condition.
- A feature file may not overwrite a base template file (`write_project()` raises). Shared files
  (`package.json`, `.env.example`, `CLAUDE.md`, README via `__FEATURES_SECTION__`) are amended in
  `write_project()`.
- Adding a feature: a `Feature` in `features.py` (add it to `ALL`), its files under
  `features/<key>/`, a `Combo` for anything that depends on another feature, and a test. The CLI
  flag and the prompt entry come from `ALL` automatically.
- Every setup step a feature leaves to the developer goes in its `todo` text; every env var it reads
  goes in its `env` text (a test checks that TODO.md and `.env.example` agree).
- The `db` feature is deliberately only the DAO request/response wrappers (`DaoResponse<T>`,
  `createDaoSuccess`, `createDaoError`, `dbTryCatchResponseWrapper`, `renderError`). Do not add a
  database client, ORM, or schema to it.
- Feature code must build and start with no env vars set (CI has none): the Stripe client is created
  on first use, Google sign-in switches on only when its variables exist.
- Before editing a dependency version, read "Version pins to revisit" in README.md; several pins
  are deliberate. Check current versions with `pnpm view <pkg> version` rather than from memory.
- Scaffold test projects outside this repo (a temp directory), never inside `template/`.
- `uv tool install` snapshots the tool: after changes, the installed command needs
  `uv tool install --reinstall ~/workbench/webdev/create-buxo-app`.

## Verifying a feature change

`uv run pytest`, then scaffold with `--stripe --auth --db`, run `pnpm check && pnpm build`, and for
single features run `tsc --noEmit` and `eslint .` as well (each must compile without the others).
For runtime checks under `pnpm start`, Auth.js needs `AUTH_SECRET` and `AUTH_TRUST_HOST=true`.
