#!/usr/bin/env node
// Generates the Material 3 color roles used by Tailwind from the seed colors in theme.config.json.
//
//   pnpm theme                                  regenerate from theme.config.json
//   pnpm theme --primary "#236488"              change a seed (saved back to theme.config.json)
//   pnpm theme --secondary "#f8b8d5" --variant vibrant --contrast 0.5
//   pnpm theme --secondary none                 drop an override and derive it from primary again
//   pnpm theme --check                          exit 1 if the generated files are out of date
//
// Writes src/app/theme.css (the --md-* tokens for light and dark plus the Tailwind @theme mapping,
// so `bg-primary`, `text-on-surface-variant`, ... exist as utilities) and src/lib/theme-colors.ts
// (a few of the same colors as constants for places CSS variables can't reach).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
// Pinned to 0.3.0 in package.json: 0.4.0 ships extensionless ESM imports that plain Node can't resolve.
import {
  DynamicScheme,
  Hct,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  TonalPalette,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(root, 'theme.config.json');
const CSS_PATH = join(root, 'src/app/theme.css');
const TS_PATH = join(root, 'src/lib/theme-colors.ts');

const VARIANTS = {
  'tonal-spot': SchemeTonalSpot,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  neutral: SchemeNeutral,
  monochrome: SchemeMonochrome,
  rainbow: SchemeRainbow,
  'fruit-salad': SchemeFruitSalad,
};

// Seeds that replace a palette the scheme would otherwise derive from primary.
const OVERRIDES = ['secondary', 'tertiary', 'neutral', 'error'];

// CSS name -> DynamicScheme getter. Every role becomes --md-<name> and a Tailwind color <name>.
const ROLES = {
  primary: 'primary',
  'on-primary': 'onPrimary',
  'primary-container': 'primaryContainer',
  'on-primary-container': 'onPrimaryContainer',
  secondary: 'secondary',
  'on-secondary': 'onSecondary',
  'secondary-container': 'secondaryContainer',
  'on-secondary-container': 'onSecondaryContainer',
  tertiary: 'tertiary',
  'on-tertiary': 'onTertiary',
  'tertiary-container': 'tertiaryContainer',
  'on-tertiary-container': 'onTertiaryContainer',
  error: 'error',
  'on-error': 'onError',
  'error-container': 'errorContainer',
  'on-error-container': 'onErrorContainer',
  surface: 'surface',
  'surface-dim': 'surfaceDim',
  'surface-bright': 'surfaceBright',
  'surface-container-lowest': 'surfaceContainerLowest',
  'surface-container-low': 'surfaceContainerLow',
  'surface-container': 'surfaceContainer',
  'surface-container-high': 'surfaceContainerHigh',
  'surface-container-highest': 'surfaceContainerHighest',
  'on-surface': 'onSurface',
  'on-surface-variant': 'onSurfaceVariant',
  outline: 'outline',
  'outline-variant': 'outlineVariant',
  'inverse-surface': 'inverseSurface',
  'inverse-on-surface': 'inverseOnSurface',
  'inverse-primary': 'inversePrimary',
  scrim: 'scrim',
  shadow: 'shadow',
};

function fail(message) {
  console.error(`generate-theme: ${message}`);
  process.exit(1);
}

function normalizeHex(value, name) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value).trim());
  if (!match) fail(`${name} must be a hex color like #236488, got "${value}"`);
  const hex = match[1].length === 3 ? match[1].replace(/./g, (c) => c + c) : match[1];
  return `#${hex.toLowerCase()}`;
}

function loadConfig() {
  const { values } = parseArgs({
    options: {
      primary: { type: 'string' },
      secondary: { type: 'string' },
      tertiary: { type: 'string' },
      neutral: { type: 'string' },
      error: { type: 'string' },
      variant: { type: 'string' },
      contrast: { type: 'string' },
      check: { type: 'boolean', default: false },
    },
  });
  const { check, ...flags } = values;

  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    fail(`could not read theme.config.json: ${error.message}`);
  }

  const changed = Object.keys(flags).length > 0;
  for (const [key, value] of Object.entries(flags)) {
    config[key] = OVERRIDES.includes(key) && /^(none|null|)$/i.test(value) ? null : value;
  }

  if (!config.primary) fail('theme.config.json needs a "primary" seed color');
  config.primary = normalizeHex(config.primary, 'primary');
  for (const key of OVERRIDES) {
    config[key] = config[key] ? normalizeHex(config[key], key) : null;
  }
  config.variant = config.variant ?? 'tonal-spot';
  if (!(config.variant in VARIANTS)) {
    fail(`variant must be one of ${Object.keys(VARIANTS).join(', ')}, got "${config.variant}"`);
  }
  config.contrast = Number(config.contrast ?? 0);
  if (Number.isNaN(config.contrast) || config.contrast < -1 || config.contrast > 1) {
    fail('contrast must be a number from -1 (reduced) to 1 (high); 0 is standard');
  }

  if (changed && check) fail('--check cannot be combined with flags that change the theme');
  if (changed) writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  return { config, check };
}

function buildScheme(config, isDark) {
  const sourceColorArgb = argbFromHex(config.primary);
  const Scheme = VARIANTS[config.variant];
  const base = new Scheme(Hct.fromInt(sourceColorArgb), isDark, config.contrast);
  // An override seed keeps its own hue and chroma, so the role actually looks like the color given.
  const palette = (key) => (config[key] ? TonalPalette.fromInt(argbFromHex(config[key])) : null);
  const scheme = new DynamicScheme({
    sourceColorArgb,
    variant: base.variant,
    contrastLevel: config.contrast,
    isDark,
    primaryPalette: base.primaryPalette,
    secondaryPalette: palette('secondary') ?? base.secondaryPalette,
    tertiaryPalette: palette('tertiary') ?? base.tertiaryPalette,
    neutralPalette: palette('neutral') ?? base.neutralPalette,
    neutralVariantPalette: base.neutralVariantPalette,
  });
  scheme.errorPalette = palette('error') ?? base.errorPalette;
  return scheme;
}

function roleValues(scheme) {
  return Object.fromEntries(
    Object.entries(ROLES).map(([name, getter]) => [name, hexFromArgb(scheme[getter])])
  );
}

function declarations(values, indent) {
  return Object.entries(values)
    .map(([name, hex]) => `${indent}--md-${name}: ${hex};`)
    .join('\n');
}

function renderCss(config, light, dark) {
  const seeds = ['primary', ...OVERRIDES]
    .filter((key) => config[key])
    .map((key) => `${key} ${config[key]}`)
    .join(', ');
  return `/*
 * GENERATED by scripts/generate-theme.mjs. Do not edit by hand: change theme.config.json
 * (or pass flags) and run \`pnpm theme\`.
 *
 * Material 3 color roles from ${seeds}
 * (variant: ${config.variant}, contrast: ${config.contrast}).
 *
 * Dark follows the system setting; data-theme="light" | "dark" on <html> overrides it.
 */
:root {
  color-scheme: light dark;

${declarations(light, '  ')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${declarations(dark, '    ')}
  }
}

:root[data-theme='light'] {
  color-scheme: light;
}

:root[data-theme='dark'] {
  color-scheme: dark;

${declarations(dark, '  ')}
}

@theme inline {
${Object.keys(ROLES)
  .map((name) => `  --color-${name}: var(--md-${name});`)
  .join('\n')}
}
`;
}

function renderTs(light, dark) {
  const pick = (values) =>
    ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'surface', 'on-surface']
      .map((name) => {
        const key = name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        return `    ${key}: '${values[name]}',`;
      })
      .join('\n');
  return `// GENERATED by scripts/generate-theme.mjs. Do not edit by hand: run \`pnpm theme\`.
// For places CSS variables can't reach: the viewport theme-color, the web manifest, the share image.
export const themeColors = {
  light: {
${pick(light)}
  },
  dark: {
${pick(dark)}
  },
} as const;
`;
}

const { config, check } = loadConfig();
const light = roleValues(buildScheme(config, false));
const dark = roleValues(buildScheme(config, true));
const outputs = [
  [CSS_PATH, renderCss(config, light, dark)],
  [TS_PATH, renderTs(light, dark)],
];

if (check) {
  const stale = outputs.filter(([path, content]) => {
    try {
      return readFileSync(path, 'utf8') !== content;
    } catch {
      return true;
    }
  });
  if (stale.length > 0) {
    fail(
      `out of date: ${stale.map(([path]) => relative(root, path)).join(', ')}. Run \`pnpm theme\`.`
    );
  }
  console.log('Theme files are up to date.');
} else {
  for (const [path, content] of outputs) {
    writeFileSync(path, content);
    console.log(`wrote ${relative(root, path)}`);
  }
  console.log(
    `primary ${light.primary} / ${dark.primary} (light / dark), variant ${config.variant}`
  );
}
