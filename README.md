# create-buxo-app

Scaffolds a new website and sets up its repo, like `create-next-app`, but with my defaults:

- **Next.js (App Router) + TypeScript + Tailwind CSS v4**, pnpm
- **Material 3 theme** generated from seed colors by a `material-color-utilities` script, exposed as
  Tailwind classes (`bg-primary`, `text-on-surface-variant`, ...), light and dark
- **Vitest** + Testing Library, with starter tests
- **CI** (GitHub Actions): Prettier check, ESLint, theme check, type check, tests, build
- **Building-block components**: buttons, cards, text fields, dialog, tags, chips, top bar, nav
  drawer, footer, theme toggle, plus a `/styleguide` page that shows them all
- SEO plumbing: `pageMetadata()`, JSON-LD, sitemap, robots, manifest, share image
- **Optional boilerplate**, asked for at scaffold time: Stripe payments, auth (Auth.js), and db
  request/response wrappers, plus a `TODO.md` listing what is left to connect them
- **Repo setup**: `git init`, first commit on `main`, a `canary` branch, and optionally a GitHub repo

## Use

```bash
# run straight from this folder
uvx --from ~/workbench/webdev/create-buxo-app create-buxo-app my-site

# or install it once and call it from anywhere
uv tool install ~/workbench/webdev/create-buxo-app
create-buxo-app my-site
```

`uv tool install` takes a snapshot: after editing the template, run it again with `--reinstall`
(or install with `--editable` to always use the working copy).

With no flags it asks for the site name, description, colors, which optional boilerplate to add, and
whether to create a GitHub repo.
Every question has a flag, and `--yes` takes the defaults without asking:

```bash
create-buxo-app my-site --yes
create-buxo-app bakery --name "Riverside Community Bakery" --primary "#a7c3d9" --secondary "#f8b8d5"
create-buxo-app client-site --github private --owner Some-Org
create-buxo-app shop --stripe --auth --db
create-buxo-app sketch --yes --no-install --no-git
```

| Flag                               | Default              | What                                                    |
| ---------------------------------- | -------------------- | ------------------------------------------------------- |
| `directory`                        | asked                | Where to create it. Also becomes the package/repo name  |
| `--name`, `--description`          | from directory       | Site name and description (metadata, footer, README)    |
| `--short-name`, `--author`         | derived, git user    | Home-screen label; author in metadata                   |
| `--primary`                        | `#3b6ea5`            | Primary seed color                                      |
| `--secondary`, `--tertiary`        | derived from primary | Optional extra seeds                                    |
| `--variant`, `--contrast`          | `tonal-spot`, `0`    | Material scheme variant; contrast from -1 to 1          |
| `--stripe`, `--auth`, `--db`       | asked (none w/ -y)   | Optional boilerplate, see below. `--no-<name>` skips it |
| `--no-install`                     | installs             | Skip `pnpm install`, theme generation, and formatting   |
| `--no-git`                         | git on               | Skip `git init` and the first commit                    |
| `--default-branch`                 | `main`               | Branch CI protects                                      |
| `--dev-branch` / `--no-dev-branch` | `canary`             | Branch checked out after the first commit               |
| `--github private\|public\|none`   | asked (`none` w/ -y) | Create the repo with `gh` and push both branches        |
| `--owner`                          | your gh account      | GitHub user or org for the repo                         |

Needs `pnpm` and `git` on the PATH, and `gh` (logged in) for `--github`. Problems that can be
caught early (directory not empty, bad color, repo name taken) stop the run before anything is
written.

## Optional boilerplate

Each one is asked for (one checkbox prompt), or set with its flag. With `--yes`, none is added unless
its flag is given.

| Flag       | Adds                                                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--stripe` | `stripe` client, a Checkout server action, and a signature-checked webhook route                                                                                        |
| `--auth`   | Auth.js (`next-auth` v5): config with optional Google sign-in, route handler, `src/proxy.ts`                                                                            |
| `--db`     | Only the DAO wrappers: `DaoResponse<T>` success/fail states, `createDaoSuccess`/`createDaoError`, `dbTryCatchResponseWrapper`, `renderError`. No database client or ORM |

`--db` with `--auth` also adds `dbAuthWrapper` (signed-in users only). When any is picked, the project
gets a `TODO.md` with the setup steps for exactly those features (accounts, keys, env vars, what to
write next), their variables in `.env.example`, and an "Added features" section in its README and
CLAUDE.md. A project with none of them is byte-for-byte what it was before this existed.

## What it does, in order

1. Renders `src/create_buxo_app/template/` into the directory, then lays the picked features' files
   (`src/create_buxo_app/features/<name>/`) over it and writes `TODO.md`.
2. `pnpm install`, `pnpm theme` (generates the colors from your seeds), Prettier.
3. `git init`, commit on `main`.
4. With `--github`: `gh repo create --push`.
5. Creates `canary`, checks it out, and pushes it if there is a remote.

The generated project's own README documents the theme script, the components, and conventions.

## Changing the template

The template is plain files under `src/create_buxo_app/template/`:

- `dot_name` is written as `.name` (so `dot_gitignore`, `dot_github/`). They are stored this way so
  packaging never treats them as real dotfiles.
- Files ending in `.tmpl` get `__TOKEN__` placeholders filled in (see `_tokens()` in `scaffold.py`)
  and lose the suffix. Everything else is copied byte for byte.
- `theme.config.json` and `src/app/icon.svg` are written by `scaffold.py`, not stored.
- `src/app/theme.css` and `src/lib/theme-colors.ts` are the output of `pnpm theme` for the default
  seed. If you change `DEFAULT_PRIMARY` or `scripts/generate-theme.mjs`, regenerate them in a
  scaffolded project and copy them back, since `--no-install` projects use them as is.

Optional features are declared in `src/create_buxo_app/features.py` (dependencies, env vars, README
rows, TODO items) and their files live in `src/create_buxo_app/features/<key>/`, with the same
`dot_`/`.tmpl` rules. `features/<a>+<b>/` holds files added only when both are picked. A feature file
may not replace a base template file; shared files (`package.json`, `.env.example`, `CLAUDE.md`,
the README) are amended in `write_project()`.

Keep template files Prettier-clean: the tool formats after installing, but `--no-install` projects
are committed exactly as stored.

```bash
uv run pytest                                     # tests for the tool itself
uv run create-buxo-app /tmp/try-it --yes          # try the working copy
cd /tmp/try-it && pnpm check && pnpm build        # the real test of a template change
uv run create-buxo-app /tmp/try-all --yes --stripe --auth --db   # same, for the feature files
```

### Version pins to revisit

- `next-auth` is pinned to `5.0.0-beta.32` (in `features.py`): v5 has no stable release yet.
- `typescript` is held at 6.x: `typescript-eslint` does not support 7.0 yet and lint crashes on it.
- `@material/material-color-utilities` is pinned to 0.3.0: 0.4.0 ships ESM imports that plain Node
  can't resolve.
- `pnpm-workspace.yaml` allows ESLint 10 for `eslint-config-next`'s React plugins, whose peer ranges
  still stop at 9 (ESLint 9 itself is now deprecated).
