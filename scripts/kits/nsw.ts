import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { overrides } from '../../src/kits/nsw/catalogue/overrides';
import { sources } from '../../src/kits/nsw/catalogue/sources';
import { NSW_CATEGORIES } from '../../src/kits/nsw/categories';
import type { KitBuildConfig } from '../lib/buildCatalogue';

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve('nsw-design-system/package.json'));
const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8')) as {
  version: string;
};
const css = readFileSync(resolve(pkgDir, 'dist/css/main.css'), 'utf8');
const js = readFileSync(resolve(pkgDir, 'dist/js/main.js'), 'utf8');

const cssClasses = new Set<string>();
for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssClasses.add(m[1]!);

export const nswBuild: KitBuildConfig & { id: string; version: string } = {
  id: 'nsw',
  version: pkg.version,
  label: `nsw-design-system ${pkg.version} main.css`,
  sources,
  overrides,
  categories: NSW_CATEGORIES,
  cssClasses,
  // Classes that legitimately have no rule of their own in main.css.
  allowedClasses: new Set(['material-icons', 'sr-only']),
  js,
};

/** Material Icons names for the icon picker, from the installed font package. */
export function nswIcons(root: string): string[] {
  const iconSrc = readFileSync(
    resolve(root, 'node_modules/material-icons/css/_codepoints.scss'),
    'utf8',
  );
  const icons = [...iconSrc.matchAll(/^\s*"([^"]+)":\s*[0-9a-f]+/gim)].map((m) => m[1]!).sort();
  if (icons.length < 500)
    throw new Error(
      `Only found ${icons.length} Material Icons names; the package format may have changed`,
    );
  return icons;
}
