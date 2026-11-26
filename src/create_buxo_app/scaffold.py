"""Rendering the template: pure file work, no prompts and no subprocesses."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from . import features as feature_set

TEMPLATE_DIR = Path(__file__).parent / "template"

DEFAULT_PRIMARY = "#3b6ea5"
DEFAULT_DESCRIPTION = "A new site built with Next.js, TypeScript, and Tailwind CSS."
FALLBACK_PNPM_VERSION = "10.33.0"

VARIANTS = (
    "tonal-spot",
    "fidelity",
    "content",
    "vibrant",
    "expressive",
    "neutral",
    "monochrome",
    "rainbow",
    "fruit-salad",
)

# Template files and folders are stored as dot_name so packaging and tooling never treat them as
# real dotfiles (a .gitignore inside the template would otherwise filter the template itself).
DOT_PREFIX = "dot_"
TEMPLATE_SUFFIX = ".tmpl"
SKIP_NAMES = {"__pycache__", "node_modules", ".next", ".DS_Store"}

_HEX_RE = re.compile(r"^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
_PACKAGE_NAME_RE = re.compile(r"^[a-z0-9][a-z0-9._-]*$")
_TOKEN_RE = re.compile(r"__[A-Z][A-Z0-9_]*__")


@dataclass
class ProjectOptions:
    """Everything the template needs to know about the new project."""

    package_name: str
    site_name: str
    description: str = DEFAULT_DESCRIPTION
    short_name: str = ""
    author: str = ""
    primary: str = DEFAULT_PRIMARY
    secondary: str | None = None
    tertiary: str | None = None
    variant: str = "tonal-spot"
    contrast: float = 0.0
    default_branch: str = "main"
    dev_branch: str | None = "canary"
    github_slug: str | None = None
    pnpm_version: str = FALLBACK_PNPM_VERSION
    features: tuple[str, ...] = ()  # optional boilerplate, keys of features.BY_KEY

    def __post_init__(self) -> None:
        if not is_valid_package_name(self.package_name):
            raise ValueError(f"invalid package name: {self.package_name!r}")
        self.site_name = self.site_name.strip()
        if not self.site_name:
            raise ValueError("site name must not be empty")
        self.description = " ".join(self.description.split()) or DEFAULT_DESCRIPTION
        self.short_name = self.short_name.strip() or default_short_name(self.site_name)
        self.primary = normalize_hex(self.primary)
        self.secondary = normalize_hex(self.secondary) if self.secondary else None
        self.tertiary = normalize_hex(self.tertiary) if self.tertiary else None
        if self.variant not in VARIANTS:
            raise ValueError(f"variant must be one of {', '.join(VARIANTS)}")
        if not -1 <= self.contrast <= 1:
            raise ValueError("contrast must be between -1 and 1")
        self.features = feature_set.normalize(self.features)

    @property
    def uses_default_theme(self) -> bool:
        """True when the theme files shipped in the template already match these options."""
        return (
            self.primary == DEFAULT_PRIMARY
            and not self.secondary
            and not self.tertiary
            and self.variant == "tonal-spot"
            and self.contrast == 0
        )


def normalize_hex(value: str) -> str:
    """'#ABC' / 'aabbcc' -> '#aabbcc'. Raises ValueError for anything that isn't a hex color."""
    match = _HEX_RE.match(value.strip())
    if not match:
        raise ValueError(f"not a hex color (expected something like #236488): {value!r}")
    digits = match.group(1)
    if len(digits) == 3:
        digits = "".join(c * 2 for c in digits)
    return f"#{digits.lower()}"


def slugify(name: str) -> str:
    """A directory or site name -> a valid npm package name ('' if nothing usable is left)."""
    slug = re.sub(r"[^a-z0-9._-]+", "-", name.strip().lower())
    return slug.strip("-._")


def is_valid_package_name(name: str) -> bool:
    return bool(_PACKAGE_NAME_RE.match(name)) and len(name) <= 214


def titleize(slug: str) -> str:
    """'my-cool_site' -> 'My Cool Site'."""
    words = [word for word in re.split(r"[-_.\s]+", slug) if word]
    return " ".join(word[:1].upper() + word[1:] for word in words)


def default_short_name(site_name: str) -> str:
    """Home-screen label: the name itself if it is short, otherwise its first word."""
    if len(site_name) <= 12:
        return site_name
    return site_name.split()[0][:12]


def js_string(value: str) -> str:
    """A JS string literal quoted the way Prettier would (single quotes unless that needs more escapes)."""
    quote = '"' if value.count("'") > value.count('"') else "'"
    escaped = value.replace("\\", "\\\\").replace(quote, "\\" + quote)
    escaped = escaped.replace("\n", "\\n").replace("\r", "\\r").replace("\u2028", "\\u2028")
    return f"{quote}{escaped}{quote}"


def js_const(name: str, value: str, width: int = 100) -> str:
    """`export const NAME = 'value';`, broken after the `=` when too long, as Prettier would."""
    literal = js_string(value)
    statement = f"export const {name} = {literal};"
    if len(statement) <= width:
        return statement
    return f"export const {name} =\n  {literal};"


def on_color(hex_color: str) -> str:
    """Black or white, whichever reads better on the given background (WCAG relative luminance)."""

    def channel(offset: int) -> float:
        c = int(hex_color[offset : offset + 2], 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
    return "#000000" if luminance > 0.179 else "#ffffff"


def render_icon(options: ProjectOptions) -> str:
    """Placeholder favicon: the site's initial on the primary seed color."""
    letter = next((c for c in options.site_name if c.isalnum()), "•").upper()
    letter = letter.replace("&", "&amp;").replace("<", "&lt;")
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        f'  <rect width="64" height="64" rx="14" fill="{options.primary}" />\n'
        '  <text x="32" y="33" text-anchor="middle" dominant-baseline="central" '
        'font-family="ui-sans-serif, system-ui, sans-serif" font-size="38" font-weight="700" '
        f'fill="{on_color(options.primary)}">{letter}</text>\n'
        "</svg>\n"
    )


def render_theme_config(options: ProjectOptions) -> str:
    config = {
        "primary": options.primary,
        "secondary": options.secondary,
        "tertiary": options.tertiary,
        "neutral": None,
        "error": None,
        "variant": options.variant,
        # 0.0 -> 0, so the file matches what `pnpm theme` writes back
        "contrast": int(options.contrast) if options.contrast == int(options.contrast) else options.contrast,
    }
    return json.dumps(config, indent=2) + "\n"


def _tokens(options: ProjectOptions) -> dict[str, str]:
    badge = ""
    if options.github_slug:
        base = f"https://github.com/{options.github_slug}/actions/workflows/ci.yml"
        badge = f"\n[![ci]({base}/badge.svg)]({base})\n"
    if options.dev_branch:
        workflow = (
            f"Work on `{options.dev_branch}`, open a PR into `{options.default_branch}`."
        )
    else:
        workflow = f"Branch off `{options.default_branch}` and open a PR back into it."
    return {
        "__PROJECT_NAME__": options.package_name,
        "__SITE_NAME__": options.site_name,
        "__SITE_DESCRIPTION__": options.description,
        "__SITE_NAME_CONST__": js_const("SITE_NAME", options.site_name),
        "__SITE_SHORT_NAME_CONST__": js_const("SITE_SHORT_NAME", options.short_name),
        "__SITE_DESCRIPTION_CONST__": js_const("SITE_DESCRIPTION", options.description),
        "__AUTHOR_NAME_CONST__": js_const("AUTHOR_NAME", options.author),
        "__DEFAULT_BRANCH__": options.default_branch,
        "__WORKFLOW__": workflow,
        "__CI_BADGE__": badge,
        "__FEATURES_SECTION__": feature_set.render_readme_section(options.features),
        "__PNPM_VERSION__": options.pnpm_version,
    }


def render_text(text: str, tokens: dict[str, str]) -> str:
    """Single pass, so a value that happens to contain a token is never substituted again."""

    def replace(match: re.Match[str]) -> str:
        token = match.group(0)
        if token not in tokens:
            raise KeyError(f"template uses unknown token {token}")
        return tokens[token]

    return _TOKEN_RE.sub(replace, text)


def output_path(relative: Path) -> Path:
    """Template path -> project path: dot_x becomes .x and the .tmpl suffix is dropped."""
    parts = [
        "." + part[len(DOT_PREFIX) :] if part.startswith(DOT_PREFIX) else part
        for part in relative.parts
    ]
    if parts[-1].endswith(TEMPLATE_SUFFIX):
        parts[-1] = parts[-1][: -len(TEMPLATE_SUFFIX)]
    return Path(*parts)


def template_files(root: Path = TEMPLATE_DIR) -> list[Path]:
    """Files under a template root (the base template or a feature overlay), relative to it."""
    return sorted(
        path.relative_to(root)
        for path in root.rglob("*")
        if path.is_file() and not SKIP_NAMES.intersection(path.relative_to(root).parts)
    )


def add_dependencies(
    package_json: str,
    dependencies: dict[str, str],
    dev_dependencies: dict[str, str] | None = None,
    scripts: dict[str, str] | None = None,
) -> str:
    """Add dependencies and scripts to a rendered package.json. Dependencies stay sorted as pnpm
    would sort them; scripts go after the template's own, in the order given."""
    if not (dependencies or dev_dependencies or scripts):
        return package_json
    package = json.loads(package_json)
    package["scripts"] = {**package["scripts"], **(scripts or {})}
    package["dependencies"] = dict(sorted({**package["dependencies"], **dependencies}.items()))
    package["devDependencies"] = dict(sorted({**package["devDependencies"], **(dev_dependencies or {})}.items()))
    return json.dumps(package, indent=2) + "\n"


def write_project(target: Path, options: ProjectOptions) -> list[Path]:
    """Render the template into `target` (created if missing). Returns the files written, relative."""
    tokens = _tokens(options)
    written: list[Path] = []

    def write(relative: Path, content: str | bytes) -> None:
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            destination.write_bytes(content)
        else:
            destination.write_text(content, encoding="utf-8", newline="\n")
        written.append(relative)

    # The base template first, then each picked feature's files on top
    for root in (TEMPLATE_DIR, *feature_set.overlay_dirs(options.features)):
        for relative in template_files(root):
            source = root / relative
            destination = output_path(relative)
            if destination in written:
                raise ValueError(f"{source} would overwrite {destination} from the base template")
            if relative.name.endswith(TEMPLATE_SUFFIX):
                write(destination, render_text(source.read_text(encoding="utf-8"), tokens))
            else:
                write(destination, source.read_bytes())

    write(Path("theme.config.json"), render_theme_config(options))
    write(Path("src/app/icon.svg"), render_icon(options))

    if options.features:
        # Files every feature adds to rather than owns
        def amend(relative: str, change) -> None:
            path = target / relative
            path.write_text(change(path.read_text(encoding="utf-8")), encoding="utf-8", newline="\n")

        amend(
            "package.json",
            lambda text: add_dependencies(
                text,
                feature_set.dependencies(options.features),
                feature_set.dev_dependencies(options.features),
                feature_set.scripts(options.features),
            ),
        )
        amend(".prettierignore", lambda text: text + feature_set.render_prettier_ignore(options.features))
        amend(".env.example", lambda text: text + feature_set.render_env(options.features))
        amend("CLAUDE.md", lambda text: text + feature_set.render_claude_section(options.features))
        write(Path("TODO.md"), feature_set.render_todo(options.site_name, options.features))
    return written
