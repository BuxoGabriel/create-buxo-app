"""Command line entry point: gather options, render the template, then install, commit, and publish."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import questionary
from rich.console import Console
from rich.markup import escape
from rich.panel import Panel

from . import __version__
from .features import ALL as ALL_FEATURES
from .scaffold import (
    DEFAULT_DESCRIPTION,
    DEFAULT_PRIMARY,
    FALLBACK_PNPM_VERSION,
    VARIANTS,
    ProjectOptions,
    is_valid_package_name,
    normalize_hex,
    slugify,
    titleize,
    write_project,
)

console = Console(highlight=False)
COMMIT_MESSAGE = "chore: scaffold with create-buxo-app"


class Abort(Exception):
    """A problem to report to the user without a traceback."""


@dataclass
class Plan:
    """What to do around the template: where it goes and which setup steps run."""

    target: Path
    options: ProjectOptions
    install: bool
    git: bool
    github: str | None  # "private" | "public" | None
    warnings: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="create-buxo-app",
        description=(
            "Scaffold a Next.js + TypeScript + Tailwind site with a generated Material 3 theme, "
            "Vitest, ESLint/Prettier, CI, and building-block components, then set up its repo. "
            "Anything not given as a flag is asked for interactively."
        ),
    )
    parser.add_argument("directory", nargs="?", help="where to create the project, e.g. my-site")
    parser.add_argument("-y", "--yes", action="store_true", help="accept defaults, never prompt")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")

    site = parser.add_argument_group("site")
    site.add_argument("--name", help="site name shown in the UI and metadata (default: from directory)")
    site.add_argument("--description", help="one or two sentences for metadata and the footer")
    site.add_argument("--short-name", help="home-screen label, about 12 characters")
    site.add_argument("--author", help="author name for metadata (default: git user.name)")

    theme = parser.add_argument_group("theme (Material 3, change later with `pnpm theme`)")
    theme.add_argument("--primary", help=f"primary seed color as hex (default: {DEFAULT_PRIMARY})")
    theme.add_argument("--secondary", help="secondary seed color (default: derived from primary)")
    theme.add_argument("--tertiary", help="tertiary seed color (default: derived from primary)")
    theme.add_argument("--variant", choices=VARIANTS, default="tonal-spot", help="scheme variant")
    theme.add_argument(
        "--contrast", type=float, default=0.0, help="-1 (reduced) to 1 (high), default 0"
    )

    extras = parser.add_argument_group(
        "optional boilerplate (default: ask, or none with --yes; setup steps land in TODO.md)"
    )
    for feature in ALL_FEATURES:
        extras.add_argument(
            f"--{feature.key}",
            action=argparse.BooleanOptionalAction,
            default=None,
            help=feature.label,
        )

    setup = parser.add_argument_group("setup")
    setup.add_argument(
        "--install",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="run pnpm install, generate the theme, and format (default: yes)",
    )
    setup.add_argument(
        "--git",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="git init and make the first commit (default: yes)",
    )
    setup.add_argument("--default-branch", default="main", help="main branch name (default: main)")
    setup.add_argument(
        "--dev-branch",
        default="canary",
        help="development branch created and checked out after the first commit (default: canary)",
    )
    setup.add_argument(
        "--no-dev-branch", dest="dev_branch", action="store_const", const=None, help="stay on main"
    )
    setup.add_argument(
        "--github",
        choices=("private", "public", "none"),
        help="create a GitHub repo with gh and push (default: ask, or none with --yes)",
    )
    setup.add_argument("--owner", help="GitHub user or organization for the repo (default: you)")
    return parser


# --- small process helpers -------------------------------------------------------------------


def capture(command: list[str], cwd: Path | None = None) -> str | None:
    """Run a quick command and return its trimmed stdout, or None if it fails or is missing."""
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, check=False)
    except OSError:
        return None
    return result.stdout.strip() if result.returncode == 0 else None


def step(plan: Plan, label: str, command: list[str]) -> bool:
    """Run one setup step in the project with a spinner. Failures are recorded, not raised."""
    try:
        with console.status(f"{label}…"):
            result = subprocess.run(
                command,
                cwd=plan.target,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                check=False,
            )
    except OSError as error:
        result = subprocess.CompletedProcess(command, 1, stdout=str(error))
    if result.returncode == 0:
        console.print(f"[green]✓[/green] {label}")
        return True
    console.print(f"[red]✗[/red] {label} failed: [dim]{escape(' '.join(command))}[/dim]")
    tail = "\n".join((result.stdout or "").strip().splitlines()[-25:])
    if tail:
        console.print(Panel(escape(tail), border_style="red", expand=False))
    plan.failed.append(label)
    return False


# --- gathering options -----------------------------------------------------------------------


def ask(question: questionary.Question):
    """Run a prompt; Ctrl-C or Esc cancels the whole run."""
    answer = question.ask()
    if answer is None:
        raise Abort("Cancelled. Nothing was created.")
    return answer


def hex_validator(optional: bool):
    def validate(text: str) -> bool | str:
        if optional and not text.strip():
            return True
        try:
            normalize_hex(text)
        except ValueError:
            return "Enter a hex color like #236488"
        return True

    return validate


def check_target(target: Path) -> None:
    if target.exists() and not target.is_dir():
        raise Abort(f"{target} exists and is not a directory.")
    if target.is_dir() and any(target.iterdir()):
        raise Abort(f"{target} already exists and is not empty. Pick another name or empty it first.")


def resolve_github(args: argparse.Namespace, package_name: str, interactive: bool) -> tuple[str | None, str | None]:
    """Decide whether to publish, and check up front that it can work. Returns (visibility, slug)."""
    choice = args.github
    if choice is None and interactive and args.git:
        if shutil.which("gh") is None:
            console.print("[dim]gh is not installed, skipping the GitHub repo.[/dim]")
        else:
            choice = ask(
                questionary.select(
                    "Create a GitHub repo and push?",
                    choices=[
                        questionary.Choice("No, keep it local", "none"),
                        questionary.Choice("Yes, private", "private"),
                        questionary.Choice("Yes, public", "public"),
                    ],
                )
            )
    if choice in (None, "none"):
        return None, None

    if not args.git:
        raise Abort("--github needs a git repo; drop --no-git.")
    if shutil.which("gh") is None:
        raise Abort("--github needs the GitHub CLI (gh). Install it from https://cli.github.com.")
    owner = args.owner or capture(["gh", "api", "user", "--jq", ".login"])
    if not owner:
        raise Abort("gh is not logged in. Run `gh auth login`, or pass --github none.")
    slug = f"{owner}/{package_name}"
    if capture(["gh", "repo", "view", slug, "--json", "name"]) is not None:
        raise Abort(f"github.com/{slug} already exists. Pick another name or pass --github none.")
    return choice, slug


def resolve_features(args: argparse.Namespace, interactive: bool) -> tuple[str, ...]:
    """Features switched on by flag, plus whatever the user ticks among the ones no flag decided."""
    picked = [feature.key for feature in ALL_FEATURES if getattr(args, feature.key)]
    undecided = [feature for feature in ALL_FEATURES if getattr(args, feature.key) is None]
    if interactive and undecided:
        picked += ask(
            questionary.checkbox(
                "Add boilerplate for any of these? (space to select, enter to continue)",
                choices=[questionary.Choice(feature.label, feature.key) for feature in undecided],
            )
        )
    return tuple(picked)


def gather(args: argparse.Namespace) -> Plan:
    interactive = not args.yes and sys.stdin.isatty() and sys.stdout.isatty()

    directory = args.directory
    if not directory:
        if not interactive:
            raise Abort("Give a directory for the project, e.g. `create-buxo-app my-site`.")
        directory = ask(
            questionary.text(
                "Project directory:",
                default="my-site",
                validate=lambda text: bool(text.strip()) or "Enter a directory name",
            )
        ).strip()
    target = Path(directory).expanduser().resolve()
    check_target(target)

    package_name = slugify(target.name)
    if not is_valid_package_name(package_name):
        raise Abort(
            f"Can't turn {target.name!r} into a package name. Use letters, digits, and dashes."
        )

    site_name = args.name
    description = args.description
    primary = args.primary
    secondary = args.secondary
    if interactive:
        if site_name is None:
            site_name = ask(
                questionary.text(
                    "Site name:",
                    default=titleize(package_name),
                    validate=lambda text: bool(text.strip()) or "Enter a name",
                )
            )
        if description is None:
            description = ask(questionary.text("Description:", default=DEFAULT_DESCRIPTION))
        if primary is None:
            primary = ask(
                questionary.text(
                    "Primary color (hex):", default=DEFAULT_PRIMARY, validate=hex_validator(False)
                )
            )
        if secondary is None:
            secondary = ask(
                questionary.text(
                    "Secondary color (hex, blank to derive it from primary):",
                    validate=hex_validator(True),
                )
            )

    features = resolve_features(args, interactive)
    github, github_slug = resolve_github(args, package_name, interactive)

    author = args.author
    if author is None:
        author = capture(["git", "config", "user.name"]) or ""

    try:
        options = ProjectOptions(
            package_name=package_name,
            site_name=site_name or titleize(package_name),
            description=description or DEFAULT_DESCRIPTION,
            short_name=args.short_name or "",
            author=author,
            primary=primary or DEFAULT_PRIMARY,
            secondary=(secondary or "").strip() or None,
            tertiary=args.tertiary,
            variant=args.variant,
            contrast=args.contrast,
            default_branch=args.default_branch,
            dev_branch=args.dev_branch if args.git else None,
            github_slug=github_slug,
            pnpm_version=capture(["pnpm", "--version"]) or FALLBACK_PNPM_VERSION,
            features=features,
        )
    except ValueError as error:
        raise Abort(str(error)) from error

    return Plan(target=target, options=options, install=args.install, git=args.git, github=github)


# --- doing the work --------------------------------------------------------------------------


def install_dependencies(plan: Plan) -> bool:
    """pnpm install, then the two steps that need node_modules. Returns True if all of it ran."""
    if not plan.install:
        return False
    if shutil.which("pnpm") is None:
        plan.warnings.append(
            "pnpm was not found, so dependencies were not installed. Install it "
            "(`corepack enable pnpm` or https://pnpm.io/installation) and run `pnpm install`."
        )
        return False
    if not step(plan, "Install dependencies (pnpm install)", ["pnpm", "install"]):
        return False
    themed = step(plan, "Generate Material 3 theme (pnpm theme)", ["pnpm", "run", "theme"])
    formatted = step(plan, "Format (prettier)", ["pnpm", "exec", "prettier", "--write", "."])
    return themed and formatted


def init_git(plan: Plan) -> bool:
    """git init, first commit on the default branch. The dev branch is created later, after pushing."""
    if shutil.which("git") is None:
        plan.warnings.append("git was not found, so no repo was created.")
        return False
    if capture(["git", "rev-parse", "--is-inside-work-tree"], cwd=plan.target) == "true":
        plan.warnings.append(
            "The project is inside an existing git repo, so no new repo was created for it."
        )
        return False
    branch = plan.options.default_branch
    return (
        step(plan, f"Initialize git repo on {branch}", ["git", "init", "--initial-branch", branch])
        and step(plan, "Stage files", ["git", "add", "--all"])
        and step(plan, "Create first commit", ["git", "commit", "--message", COMMIT_MESSAGE])
    )


def publish(plan: Plan) -> bool:
    slug = plan.options.github_slug
    assert slug and plan.github
    command = [
        "gh", "repo", "create", slug,
        f"--{plan.github}",
        "--source", ".",
        "--remote", "origin",
        "--description", plan.options.description[:350],
        "--push",
    ]  # fmt: skip
    return step(plan, f"Create {plan.github} GitHub repo {slug} and push", command)


def create_dev_branch(plan: Plan, pushed: bool) -> None:
    branch = plan.options.dev_branch
    if not branch or branch == plan.options.default_branch:
        return
    if step(plan, f"Switch to development branch {branch}", ["git", "switch", "--create", branch]):
        if pushed:
            step(plan, f"Push {branch}", ["git", "push", "--set-upstream", "origin", branch])


def execute(plan: Plan) -> None:
    options = plan.options
    files = write_project(plan.target, options)
    console.print(f"[green]✓[/green] Wrote {len(files)} files to {plan.target}")

    ready = install_dependencies(plan)
    if not ready and not options.uses_default_theme:
        plan.warnings.append(
            "The theme files still hold the default colors. Your seeds are saved in "
            "theme.config.json: run `pnpm install && pnpm theme` to apply them."
        )

    if plan.git and init_git(plan):
        pushed = bool(plan.github) and publish(plan)
        create_dev_branch(plan, pushed)
        if not ready:
            plan.warnings.append(
                "There is no pnpm-lock.yaml yet, and CI installs with --frozen-lockfile: "
                "run `pnpm install` and commit the lockfile before opening a PR."
            )


def report(plan: Plan) -> None:
    options = plan.options
    for warning in plan.warnings:
        console.print(f"[yellow]![/yellow] {warning}")

    try:
        shown = plan.target.relative_to(Path.cwd())
    except ValueError:
        shown = plan.target
    lines = [f"cd {shown}"] if shown != Path(".") else []
    if not (plan.target / "node_modules").exists():
        lines.append("pnpm install")
    lines += ["pnpm dev              [dim]# http://localhost:3000, components at /styleguide[/dim]"]
    lines += ["pnpm check            [dim]# format check, lint, typecheck, tests[/dim]"]
    lines += ['pnpm theme --primary "#rrggbb"   [dim]# change the color theme[/dim]']
    if options.features:
        added = ", ".join(options.features)
        lines += ["", f"Added boilerplate: {added}. [bold]TODO.md[/bold] lists what to set up to finish connecting it."]

    title = f"{options.site_name} is ready" if not plan.failed else f"{options.site_name} was created, with problems"
    console.print()
    console.print(Panel("\n".join(lines), title=escape(title), title_align="left", expand=False))
    if options.github_slug and "GitHub" not in " ".join(plan.failed):
        console.print(f"Repo: https://github.com/{options.github_slug}")
    if plan.failed:
        console.print(
            f"[red]{len(plan.failed)} step(s) failed:[/red] {escape(', '.join(plan.failed))}. "
            "The files are in place; fix the cause above and rerun those steps by hand."
        )


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        plan = gather(args)
        execute(plan)
    except Abort as error:
        console.print(f"[red]{escape(str(error))}[/red]")
        return 1
    except KeyboardInterrupt:
        console.print("\n[red]Interrupted.[/red] The project directory may be incomplete.")
        return 130
    report(plan)
    return 1 if plan.failed else 0


if __name__ == "__main__":
    sys.exit(main())
