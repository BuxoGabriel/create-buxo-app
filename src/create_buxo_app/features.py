"""Optional boilerplate (Stripe, auth, db wrappers): what each one adds and what is left for the dev.

The files live in `features/<key>/` and are laid over the template with the same naming rules
(`dot_name`, `.tmpl`). `features/<a>+<b>/` holds files that only make sense when both are picked.
Everything else a feature contributes (dependencies, env vars, docs, TODO items) is declared here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

FEATURES_DIR = Path(__file__).parent / "features"


@dataclass(frozen=True)
class Feature:
    key: str
    label: str  # shown in the prompt
    title: str  # heading in TODO.md and the README
    summary: str  # one line for the README and CLAUDE.md
    dependencies: dict[str, str] = field(default_factory=dict)
    dev_dependencies: dict[str, str] = field(default_factory=dict)
    scripts: dict[str, str] = field(default_factory=dict)  # added to package.json
    env: str = ""  # appended to .env.example
    prettier_ignore: str = ""  # appended to .prettierignore
    files: tuple[tuple[str, str], ...] = ()  # (path, what it is) for the README table
    todo: str = ""  # markdown checklist for TODO.md
    # A different checklist for when another feature is picked too: {that feature's key: text}
    todo_with: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class Combo:
    """Extra files and TODO items for a pair of features picked together."""

    keys: tuple[str, str]
    title: str
    files: tuple[tuple[str, str], ...] = ()
    todo: str = ""

    @property
    def directory(self) -> str:
        return "+".join(self.keys)


STRIPE = Feature(
    key="stripe",
    label="Stripe payments (checkout action + webhook route)",
    title="Stripe payments",
    summary=(
        "Stripe Checkout through `checkoutAction` (`src/actions/checkout-action.ts`); payments are "
        "confirmed in the webhook route, never on the redirect back."
    ),
    dependencies={"server-only": "^0.0.1", "stripe": "^23.1.0"},
    env="""\
# Stripe (https://dashboard.stripe.com/apikeys). Use the test-mode keys locally.
STRIPE_SECRET_KEY=
# Signing secret of the webhook endpoint. Locally, `stripe listen` prints one.
STRIPE_WEBHOOK_SECRET=
# One price id (price_...) per entry of PRODUCTS in src/lib/server/stripe.ts
STRIPE_PRICE_EXAMPLE=
""",
    files=(
        ("src/lib/server/stripe.ts", "The Stripe client and `PRODUCTS`, the list of what can be bought"),
        ("src/actions/checkout-action.ts", "Server action that sends the visitor to Stripe Checkout"),
        ("src/app/api/stripe/webhook/route.ts", "Verifies Stripe's events; orders are fulfilled here"),
    ),
    todo="""\
- [ ] Create a Stripe account, or a sandbox for this site, at <https://dashboard.stripe.com>.
- [ ] Copy the **test** secret key (`sk_test_...`) into `.env.local` as `STRIPE_SECRET_KEY`.
- [ ] Create the products and prices in the dashboard. For each one, add an entry to `PRODUCTS` in
      `src/lib/server/stripe.ts` and its price id (`price_...`) to `.env.local`. Replace the `example`
      entry and `STRIPE_PRICE_EXAMPLE`. Use `mode: 'subscription'` for recurring prices.
- [ ] Add a buy button: a `<form action={checkoutAction}>` with a hidden `product` input (there is an
      example at the top of `src/actions/checkout-action.ts`).
- [ ] Build the pages Checkout returns to and set `success_url` / `cancel_url` in
      `src/actions/checkout-action.ts`. They point at the home page for now. Give both pages
      `noindex: true`.
- [ ] Test the webhook locally with the [Stripe CLI](https://docs.stripe.com/stripe-cli):
      `stripe listen --forward-to localhost:3000/api/stripe/webhook`, and put the `whsec_...` secret it
      prints into `.env.local` as `STRIPE_WEBHOOK_SECRET`. Pay with card `4242 4242 4242 4242`.
- [ ] Fulfil the order in the `checkout.session.completed` case of
      `src/app/api/stripe/webhook/route.ts` (save it, send the email, grant access). Stripe can deliver
      an event more than once, so make that code safe to repeat.
- [ ] Handle the other events the site depends on. Subscriptions need at least
      `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`.
- [ ] For production: add a webhook endpoint in the dashboard pointing at
      `https://<your-domain>/api/stripe/webhook`, subscribed to the events handled in the route.
- [ ] For production: set `STRIPE_SECRET_KEY` (live key), `STRIPE_WEBHOOK_SECRET` (the dashboard
      endpoint's secret, not the CLI one), and the live price ids in the host's environment variables.
- [ ] Disallow `/api/` in `src/app/robots.ts`.
""",
)

AUTH = Feature(
    key="auth",
    label="Auth (Better Auth on Postgres + Drizzle: config, schema, sign-in page, route protection)",
    title="Auth",
    summary=(
        "Better Auth (`better-auth`) configured in `src/lib/auth.ts`; `getSession()` is the check, and "
        "`src/proxy.ts` redirects signed-out visitors away from the protected routes. Users and "
        "sessions are kept in Postgres through Drizzle: schema in `src/db/`, client from `getDb()` "
        "(`src/lib/server/drizzle.ts`). After a schema change run `pnpm db:generate`, then "
        "`pnpm db:migrate`; never edit files in `drizzle/` by hand."
    ),
    dependencies={
        "better-auth": "^1.7.28",
        "drizzle-orm": "^0.45.4",
        "pg": "^8.23.1",
        "server-only": "^0.0.1",
    },
    dev_dependencies={"@types/pg": "^8.23.1", "drizzle-kit": "^0.31.11"},
    scripts={
        "db:generate": "drizzle-kit generate",
        "db:migrate": "drizzle-kit migrate",
        "db:studio": "drizzle-kit studio",
    },
    prettier_ignore="""\
# generated by drizzle-kit (`pnpm db:generate`)
drizzle/meta
""",
    env="""\
# Postgres connection string, e.g. postgres://user:password@host:5432/database
DATABASE_URL=
# Better Auth. Generate the secret with `openssl rand -base64 32`.
BETTER_AUTH_SECRET=
# Only off Vercel: the site's origin. On Vercel and locally it is worked out, see src/lib/auth.ts.
# BETTER_AUTH_URL=https://example.com
# Google sign-in is switched on when both are set (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
""",
    files=(
        ("src/lib/auth.ts", "Better Auth config: database, providers, session. Exports `getSession()`"),
        ("src/db/auth-schema.ts", "Better Auth's tables: `user`, `session`, `account`, `verification`"),
        ("src/db/schema.ts", "The Drizzle schema: re-exports the auth tables, the site's own go here"),
        ("src/lib/server/drizzle.ts", "`getDb()`: the Drizzle client on a `pg` pool, connected on first use"),
        ("drizzle.config.ts", "drizzle-kit config for `pnpm db:generate` / `db:migrate` / `db:studio`"),
        ("src/lib/auth-redirect.ts", "`safeCallbackPath()`: only paths on this site are followed after sign-in"),
        ("src/app/api/auth/[...all]/route.ts", "Better Auth's endpoints (OAuth callbacks, session, sign-out)"),
        ("src/actions/auth-actions.ts", "`signInWithGoogleAction` and `signOutAction`, used as form actions"),
        ("src/app/sign-in/page.tsx", "Starter sign-in page: one button per sign-in method"),
        ("src/proxy.ts", "Sends signed-out visitors to `/sign-in` for the routes in `PROTECTED_PREFIXES`"),
    ),
    todo="""\
- [ ] Create a Postgres database (any host: Neon, Supabase, a local server) and set its connection
      string as `DATABASE_URL` in `.env.local`. Auth does not work without it.
- [ ] Create the tables: `pnpm db:generate` writes the first migration into `drizzle/` from
      `src/db/schema.ts`, and `pnpm db:migrate` applies it. Commit `drizzle/`.
- [ ] Generate a secret (`openssl rand -base64 32`) and set it as `BETTER_AUTH_SECRET` in
      `.env.local`. In production nothing in auth works without it.
- [ ] Choose the sign-in methods and add them to `socialProviders` in `src/lib/auth.ts`, with a
      sign-in action in `src/actions/auth-actions.ts` and a button on `src/app/sign-in/page.tsx`
      for each. Google is already wired and switches on when its two variables are set.
- [ ] For Google: create an OAuth client (type "Web application") at
      <https://console.cloud.google.com/apis/credentials>, add the redirect URIs
      `http://localhost:3000/api/auth/callback/google` and
      `https://<your-domain>/api/auth/callback/google`, and set `GOOGLE_CLIENT_ID` and
      `GOOGLE_CLIENT_SECRET`.
- [ ] Decide who may sign in and enforce it in `mayUseSite()` in `src/lib/auth.ts`. As scaffolded,
      anyone who gets through a provider gets a row in `user` and is signed in.
- [ ] For email and password sign-in, see
      <https://better-auth.com/docs/authentication/email-password>. Better Auth hashes the
      passwords; never store or compare plain ones yourself.
- [ ] Set the routes that need a signed-in user: `PROTECTED_PREFIXES` **and** `config.matcher` in
      `src/proxy.ts` (it protects `/account` for now). The proxy only checks that a session cookie
      exists, which anyone can fake: also call `getSession()` in the pages, server actions, and
      route handlers that read or change private data.
- [ ] Add a sign-out control where signed-in visitors can find it: `<form action={signOutAction}>`
      with a submit button. Show the user with `await getSession()` in a server component.
- [ ] Sessions are rows in the `session` table and last 24 hours (`SESSION_DURATION`). Deleting a
      row signs that session out.
- [ ] If users need more than Better Auth keeps (a role, for example), declare the field under
      `user.additionalFields` in `src/lib/auth.ts` (<https://better-auth.com/docs/concepts/database>)
      and add the matching column to `src/db/auth-schema.ts`.
- [ ] Put the site's own tables in `src/db/schema.ts` and read them through `getDb()` from
      `src/lib/server/drizzle.ts`.
- [ ] For production: set `DATABASE_URL`, `BETTER_AUTH_SECRET` and the provider variables in the
      host's environment variables, and decide when migrations run (before the deploy, not at
      request time). On Vercel the site's address is worked out, previews included (each preview
      address needs its own redirect URI at the provider). Anywhere else, set `BETTER_AUTH_URL` to
      the site's origin.
""",
)

DB = Feature(
    key="db",
    label="DB boilerplate (request wrappers + success/fail response wrappers)",
    title="Database",
    summary=(
        "Data-access functions return a `DaoResponse<T>` (`success` + `data`, or `error`) built with "
        "the wrappers in `src/lib/server/db.ts`; they never throw at their callers."
    ),
    dependencies={"server-only": "^0.0.1"},
    files=(
        ("src/types/index.ts", "`DaoResponse<T>` and `DaoError`, the success and fail states"),
        ("src/lib/server/db.ts", "`createDaoSuccess`, `createDaoError`, `dbTryCatchResponseWrapper`"),
        ("src/lib/dao-error.ts", "`renderError()`: a `DaoError` as a message that is safe to show"),
    ),
    todo="""\
Only the wrappers are scaffolded. There is no database, client, or schema yet.

- [ ] Choose a database and a client or ORM, and install it (for example Postgres with Drizzle:
      `pnpm add drizzle-orm pg` and `pnpm add -D drizzle-kit @types/pg`).
- [ ] Add the connection string to `.env.local` and to `.env.example` (as an empty `DATABASE_URL=`).
- [ ] Create the client in `src/lib/server/` with `import 'server-only';` at the top. In development,
      keep the connection pool on `globalThis` so hot reloads reuse it instead of opening a new pool
      each time.
- [ ] Define the schema and set up migrations, and add the migration commands to `package.json`.
- [ ] Write the data-access functions in `src/lib/server/dao/`. Each one returns a
      `Promise<DaoResponse<T>>` and runs its query inside `dbTryCatchResponseWrapper` (there is an
      example at the top of `src/lib/server/db.ts`).
- [ ] In callers, check `response.success` before using `response.data`, and show failures with
      `renderError(response.error)`.
- [ ] Add a `DaoError` variant in `src/types/index.ts`, and its message in `src/lib/dao-error.ts`,
      for each failure callers must tell apart (not found, validation, conflict).
- [ ] For production: set the connection string in the host's environment variables and decide when
      migrations run (before the deploy, not at request time).
""",
    todo_with={
        "auth": """\
The wrappers are scaffolded here. The database itself (Postgres with Drizzle) came with auth: its
client is `getDb()` in `src/lib/server/drizzle.ts` and its setup steps are under Auth above.

- [ ] Add the site's tables to `src/db/schema.ts`, then run `pnpm db:generate` and `pnpm db:migrate`.
- [ ] Write the data-access functions in `src/lib/server/dao/`. Each one returns a
      `Promise<DaoResponse<T>>` and runs its query (through `getDb()`) inside
      `dbTryCatchResponseWrapper` (there is an example at the top of `src/lib/server/db.ts`).
- [ ] In callers, check `response.success` before using `response.data`, and show failures with
      `renderError(response.error)`.
- [ ] Add a `DaoError` variant in `src/types/index.ts`, and its message in `src/lib/dao-error.ts`,
      for each failure callers must tell apart (not found, validation, conflict).
""",
    },
)

ALL: tuple[Feature, ...] = (STRIPE, AUTH, DB)
BY_KEY = {feature.key: feature for feature in ALL}
FEATURE_KEYS = tuple(BY_KEY)

COMBOS: tuple[Combo, ...] = (
    Combo(
        keys=("db", "auth"),
        title="Auth + database",
        files=(("src/lib/server/db-auth.ts", "`dbAuthWrapper`: signed-in users only, else `auth-error`"),),
        todo="""\
- [ ] Wrap every data-access function that reads or changes private data in `dbAuthWrapper`
      (`src/lib/server/db-auth.ts`), outside the try/catch wrapper:
      `dbAuthWrapper(dbTryCatchResponseWrapper(async () => { ... }))()`.
- [ ] Once users have roles, check them in `dbAuthWrapper` (there is a `TODO` at the spot).
""",
    ),
    Combo(
        keys=("stripe", "db"),
        title="Stripe + database",
        todo="""\
- [ ] Store orders (or subscriptions) in a table keyed by the Checkout session id, and write to it
      from the webhook route through a data-access function. A unique key on the session id makes a
      repeated event harmless.
- [ ] If the webhook's write fails, respond with a 500 so Stripe retries the event later.
""",
    ),
    Combo(
        keys=("stripe", "auth"),
        title="Stripe + auth",
        todo="""\
- [ ] In `src/actions/checkout-action.ts`, call `getSession()` and pass the user to Stripe
      (`client_reference_id: session.user.id`, `customer_email: session.user.email`), so the webhook
      knows who paid. Refuse the checkout when the purchase needs an account and nobody is signed in.
- [ ] Gate paid content on what the webhook recorded for the user, not on the redirect to the
      success page.
""",
    ),
)


def normalize(keys) -> tuple[str, ...]:
    """Validate and put in the canonical order. Raises ValueError for an unknown feature."""
    picked = set(keys)
    unknown = picked - set(FEATURE_KEYS)
    if unknown:
        raise ValueError(f"unknown feature(s): {', '.join(sorted(unknown))}")
    return tuple(key for key in FEATURE_KEYS if key in picked)


def selected(keys: tuple[str, ...]) -> list[Feature]:
    return [BY_KEY[key] for key in keys]


def selected_combos(keys: tuple[str, ...]) -> list[Combo]:
    return [combo for combo in COMBOS if set(combo.keys) <= set(keys)]


def overlay_dirs(keys: tuple[str, ...]) -> list[Path]:
    """Directories to lay over the template, in order. Missing ones (docs-only combos) are skipped."""
    names = [*keys, *(combo.directory for combo in selected_combos(keys))]
    return [FEATURES_DIR / name for name in names if (FEATURES_DIR / name).is_dir()]


def dependencies(keys: tuple[str, ...]) -> dict[str, str]:
    merged: dict[str, str] = {}
    for feature in selected(keys):
        merged.update(feature.dependencies)
    return merged


def dev_dependencies(keys: tuple[str, ...]) -> dict[str, str]:
    merged: dict[str, str] = {}
    for feature in selected(keys):
        merged.update(feature.dev_dependencies)
    return merged


def scripts(keys: tuple[str, ...]) -> dict[str, str]:
    merged: dict[str, str] = {}
    for feature in selected(keys):
        merged.update(feature.scripts)
    return merged


def render_prettier_ignore(keys: tuple[str, ...]) -> str:
    """Text appended to .prettierignore ('' when no picked feature generates files)."""
    return "".join("\n" + feature.prettier_ignore for feature in selected(keys) if feature.prettier_ignore)


def todo_for(feature: Feature, keys: tuple[str, ...]) -> str:
    """The feature's checklist, or the variant for another picked feature that changes it."""
    for other, text in feature.todo_with.items():
        if other in keys:
            return text
    return feature.todo


def render_env(keys: tuple[str, ...]) -> str:
    """Text appended to .env.example ('' when no picked feature needs variables)."""
    return "".join("\n" + feature.env for feature in selected(keys) if feature.env)


def _file_table(rows: list[tuple[str, str]]) -> str:
    """A markdown table with padded columns, the way Prettier lays one out."""
    cells = [("Path", "What"), *((f"`{path}`", what) for path, what in rows)]
    widths = [max(len(row[column]) for row in cells) for column in (0, 1)]
    lines = [f"| {left.ljust(widths[0])} | {right.ljust(widths[1])} |" for left, right in cells]
    lines.insert(1, f"| {'-' * widths[0]} | {'-' * widths[1]} |")
    return "\n".join(lines)


def render_readme_section(keys: tuple[str, ...]) -> str:
    """The '## Added features' part of the project README ('' when nothing was picked)."""
    if not keys:
        return ""
    parts = [
        "## Added features",
        "The scaffold added the boilerplate below. None of it is connected to a real service yet: "
        "**[TODO.md](TODO.md) lists what is left to set up.**",
    ]
    for feature in selected(keys):
        parts += [f"### {feature.title}", feature.summary, _file_table(list(feature.files))]
    for combo in selected_combos(keys):
        if combo.files:
            parts += [f"### {combo.title}", _file_table(list(combo.files))]
    variables = [
        line.split("=")[0] for feature in selected(keys) for line in feature.env.splitlines() if "=" in line and not line.startswith("#")
    ]  # fmt: skip
    if variables:
        names = ", ".join(f"`{name}`" for name in variables)
        parts.append(f"Environment variables (described in `.env.example`): {names}.")
    return "\n\n".join(parts) + "\n\n"


def render_claude_section(keys: tuple[str, ...]) -> str:
    """Appended to the project's CLAUDE.md ('' when nothing was picked)."""
    if not keys:
        return ""
    lines = ["", "## Added features", "", "Setup that is still open is tracked in `TODO.md`; tick items off there.", ""]
    lines += [f"- **{feature.title}:** {feature.summary}" for feature in selected(keys)]
    for combo in selected_combos(keys):
        lines += [f"- **{combo.title}:** {what} (`{path}`)." for path, what in combo.files]
    lines.append(
        "- Files under `src/lib/server/` start with `import 'server-only';`. Never import them "
        "from a client component; tests that import them need `vi.mock('server-only', () => ({}))`."
    )
    return "\n".join(lines) + "\n"


def render_todo(site_name: str, keys: tuple[str, ...]) -> str | None:
    """TODO.md for the picked features, or None when there is nothing to set up."""
    if not keys:
        return None
    titles = [feature.title.lower() if feature.key != "stripe" else feature.title for feature in selected(keys)]
    listed = titles[0] if len(titles) == 1 else ", ".join(titles[:-1]) + " and " + titles[-1]
    parts = [
        f"# TODO: finish connecting {listed}",
        f"`create-buxo-app` added boilerplate for {listed} to {site_name}. The code is in place, but "
        "nothing is connected to a real service yet. Work through the lists below and tick items off "
        "as you go; delete this file when it is done.",
        "Secrets go in `.env.local` (copy `.env.example`), which is never committed. Production values "
        "go in the host's environment variables.",
    ]
    for feature in selected(keys):
        parts += [f"## {feature.title}", todo_for(feature, keys).rstrip("\n")]
    for combo in selected_combos(keys):
        parts += [f"## {combo.title}", combo.todo.rstrip("\n")]
    parts += [
        "## Before the first deploy",
        "- [ ] Every variable in `.env.example` is set in the host's environment variables.\n"
        "- [ ] `pnpm check && pnpm build` pass.\n"
        "- [ ] The README's \"Before launch\" list is done too.",
    ]
    return "\n\n".join(parts) + "\n"
