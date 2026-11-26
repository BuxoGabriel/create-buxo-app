import json
import re

import pytest

from create_buxo_app.cli import main
from create_buxo_app.scaffold import (
    DEFAULT_PRIMARY,
    TEMPLATE_DIR,
    ProjectOptions,
    default_short_name,
    js_const,
    js_string,
    normalize_hex,
    on_color,
    output_path,
    render_text,
    slugify,
    titleize,
    write_project,
)
from pathlib import Path


def test_normalize_hex():
    assert normalize_hex("#ABC") == "#aabbcc"
    assert normalize_hex(" 236488 ") == "#236488"
    for bad in ("", "blue", "#12345", "#gggggg"):
        with pytest.raises(ValueError):
            normalize_hex(bad)


def test_slugify_and_titleize():
    assert slugify("My Cool Site!") == "my-cool-site"
    assert slugify("--weird__name.") == "weird__name"
    assert slugify("!!!") == ""
    assert titleize("my-cool_site") == "My Cool Site"


def test_default_short_name():
    assert default_short_name("Demo Site") == "Demo Site"
    assert default_short_name("Riverside Community Bakery") == "Riverside"


def test_js_string_quotes_like_prettier():
    assert js_string("plain") == "'plain'"
    assert js_string("Gabe's site") == '"Gabe\'s site"'
    assert js_string('say "hi"') == "'say \"hi\"'"
    assert js_string("back\\slash\nline") == "'back\\\\slash\\nline'"


def test_js_const_wraps_long_values_like_prettier():
    assert js_const("A", "short") == "export const A = 'short';"
    long = "x" * 90
    assert js_const("A", long) == f"export const A =\n  '{long}';"


def test_on_color_picks_readable_text():
    assert on_color("#ffffff") == "#000000"
    assert on_color("#236488") == "#ffffff"


def test_output_path_maps_dotfiles_and_templates():
    assert output_path(Path("dot_github/workflows/ci.yml.tmpl")) == Path(".github/workflows/ci.yml")
    assert output_path(Path("src/lib/site.ts.tmpl")) == Path("src/lib/site.ts")
    assert output_path(Path("src/app/page.tsx")) == Path("src/app/page.tsx")


def test_render_text_is_single_pass_and_rejects_unknown_tokens():
    assert render_text("a __X__ b", {"__X__": "__Y__", "__Y__": "no"}) == "a __Y__ b"
    with pytest.raises(KeyError):
        render_text("__MISSING__", {})


def test_options_validation():
    with pytest.raises(ValueError):
        ProjectOptions(package_name="Bad Name", site_name="x")
    with pytest.raises(ValueError):
        ProjectOptions(package_name="ok", site_name="x", primary="nope")
    with pytest.raises(ValueError):
        ProjectOptions(package_name="ok", site_name="x", contrast=2)
    assert ProjectOptions(package_name="ok", site_name="x").uses_default_theme
    assert not ProjectOptions(package_name="ok", site_name="x", primary="#ff0000").uses_default_theme


def test_write_project(tmp_path):
    options = ProjectOptions(
        package_name="gabes-site",
        site_name="Gabe's Site",
        description='A "quoted" description',
        primary="#F0A",
        secondary="#f8b8d5",
        github_slug="someone/gabes-site",
        dev_branch=None,
    )
    written = write_project(tmp_path, options)

    for expected in (
        ".gitignore",
        ".prettierrc",
        ".github/workflows/ci.yml",
        "package.json",
        "theme.config.json",
        "scripts/generate-theme.mjs",
        "src/app/icon.svg",
        "src/app/theme.css",
        "src/components/button.tsx",
        "src/lib/site.ts",
    ):
        assert (tmp_path / expected).is_file(), expected
    assert not any(part.startswith("dot_") or part.endswith(".tmpl") for path in written for part in path.parts)

    # no template token survives anywhere
    for path in written:
        assert not re.search(r"__[A-Z][A-Z0-9_]*__", (tmp_path / path).read_text()), path

    package = json.loads((tmp_path / "package.json").read_text())
    assert package["name"] == "gabes-site"
    assert package["packageManager"].startswith("pnpm@")

    theme = json.loads((tmp_path / "theme.config.json").read_text())
    assert theme["primary"] == "#ff00aa"
    assert theme["secondary"] == "#f8b8d5"
    assert theme["contrast"] == 0

    site = (tmp_path / "src/lib/site.ts").read_text()
    assert 'export const SITE_NAME = "Gabe\'s Site";' in site
    assert "export const SITE_DESCRIPTION = 'A \"quoted\" description';" in site

    readme = (tmp_path / "README.md").read_text()
    assert readme.startswith("# Gabe's Site\n\n[![ci](https://github.com/someone/gabes-site/")
    assert "Branch off `main`" in readme
    assert "fill=\"#ff00aa\"" in (tmp_path / "src/app/icon.svg").read_text()


def test_shipped_theme_matches_default_seed():
    # theme.css in the template must be what `pnpm theme` produces for the default options,
    # because --no-install projects use it as is.
    assert f"primary {DEFAULT_PRIMARY}" in (TEMPLATE_DIR / "src/app/theme.css").read_text()


def test_template_holds_no_build_artifacts():
    assert not (TEMPLATE_DIR / "node_modules").exists()
    assert not (TEMPLATE_DIR / "pnpm-lock.yaml").exists()


def test_cli_without_install_or_git(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert main(["my-site", "--yes", "--no-install", "--no-git", "--primary", "#123456"]) == 0
    assert "export const SITE_NAME = 'My Site';" in (tmp_path / "my-site/src/lib/site.ts").read_text()
    assert not (tmp_path / "my-site/.git").exists()


def test_cli_refuses_non_empty_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "taken").mkdir()
    (tmp_path / "taken/file.txt").write_text("keep me")
    assert main(["taken", "--yes", "--no-install", "--no-git"]) == 1
    assert [p.name for p in (tmp_path / "taken").iterdir()] == ["file.txt"]


def test_cli_rejects_bad_color_before_writing(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert main(["site", "--yes", "--no-install", "--no-git", "--primary", "blue"]) == 1
    assert not (tmp_path / "site").exists()


def _project(tmp_path, *features):
    options = ProjectOptions(package_name="shop", site_name="Shop", features=features)
    return write_project(tmp_path, options)


def test_no_features_adds_nothing(tmp_path):
    written = _project(tmp_path)
    assert not (tmp_path / "TODO.md").exists()
    assert not (tmp_path / "src/lib/server").exists()
    assert "Added features" not in (tmp_path / "README.md").read_text()
    assert "\n\n\n" not in (tmp_path / "README.md").read_text()
    # package.json is the stored template, untouched
    assert (tmp_path / "package.json").read_text() == (TEMPLATE_DIR / "package.json.tmpl").read_text().replace(
        "__PROJECT_NAME__", "shop"
    ).replace("__PNPM_VERSION__", "10.33.0")
    assert Path("TODO.md") not in written


def test_unknown_feature_is_rejected():
    with pytest.raises(ValueError):
        ProjectOptions(package_name="ok", site_name="x", features=("nope",))


def test_db_feature_is_only_the_wrappers(tmp_path):
    _project(tmp_path, "db")
    for expected in ("src/types/index.ts", "src/lib/server/db.ts", "src/lib/dao-error.ts", "src/tests/db.test.ts"):
        assert (tmp_path / expected).is_file(), expected
    assert not (tmp_path / "src/lib/server/db-auth.ts").exists()  # needs auth
    assert not (tmp_path / "src/lib/auth.ts").exists()

    dependencies = json.loads((tmp_path / "package.json").read_text())["dependencies"]
    assert "server-only" in dependencies and "stripe" not in dependencies and "better-auth" not in dependencies
    assert list(dependencies) == sorted(dependencies)

    todo = (tmp_path / "TODO.md").read_text()
    assert todo.startswith("# TODO: finish connecting database\n")
    assert "## Database" in todo and "## Stripe" not in todo and "## Auth" not in todo


def test_all_features(tmp_path):
    written = _project(tmp_path, "db", "stripe", "auth")  # order given doesn't matter
    for expected in (
        "src/lib/server/stripe.ts",
        "src/actions/checkout-action.ts",
        "src/app/api/stripe/webhook/route.ts",
        "src/lib/auth.ts",
        "src/lib/auth-redirect.ts",
        "src/app/api/auth/[...all]/route.ts",
        "src/actions/auth-actions.ts",
        "src/app/sign-in/page.tsx",
        "src/proxy.ts",
        "src/lib/server/db.ts",
        "src/lib/server/db-auth.ts",
    ):
        assert (tmp_path / expected).is_file(), expected
    assert len(written) == len(set(written))

    dependencies = json.loads((tmp_path / "package.json").read_text())["dependencies"]
    assert {"stripe", "better-auth", "server-only"} <= set(dependencies)
    assert "next-auth" not in dependencies

    env = (tmp_path / ".env.example").read_text()
    for variable in ("STRIPE_SECRET_KEY=", "STRIPE_WEBHOOK_SECRET=", "BETTER_AUTH_SECRET=", "GOOGLE_CLIENT_ID="):
        assert f"\n{variable}\n" in env, variable

    todo = (tmp_path / "TODO.md").read_text()
    assert todo.startswith("# TODO: finish connecting Stripe payments, auth and database\n")
    headings = re.findall(r"^## (.+)$", todo, flags=re.MULTILINE)
    assert headings == [
        "Stripe payments",
        "Auth",
        "Database",
        "Auth + database",
        "Stripe + database",
        "Stripe + auth",
        "Before the first deploy",
    ]
    # every variable the TODO asks for is in .env.example (BETTER_AUTH_URL as a commented example)
    variables = set(re.findall(r"`((?:STRIPE|BETTER_AUTH|GOOGLE)_[A-Z_]+)`", todo))
    assert {"BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "GOOGLE_CLIENT_ID"} <= variables
    for variable in variables:
        assert f"{variable}=" in env, variable

    readme = (tmp_path / "README.md").read_text()
    assert "## Added features" in readme and "[TODO.md](TODO.md)" in readme
    assert "## Added features" in (tmp_path / "CLAUDE.md").read_text()
    for path in written:
        assert not re.search(r"__[A-Z][A-Z0-9_]*__", (tmp_path / path).read_text()), path


def test_cli_feature_flags(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert main(["plain", "--yes", "--no-install", "--no-git"]) == 0
    assert not (tmp_path / "plain/TODO.md").exists()

    assert main(["paid", "--yes", "--no-install", "--no-git", "--stripe", "--no-auth"]) == 0
    assert (tmp_path / "paid/src/lib/server/stripe.ts").is_file()
    assert not (tmp_path / "paid/src/lib/auth.ts").exists()
    assert "## Stripe payments" in (tmp_path / "paid/TODO.md").read_text()
