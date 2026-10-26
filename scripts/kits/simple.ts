import { overrides } from '../../src/kits/simple/catalogue/overrides';
import { sources } from '../../src/kits/simple/catalogue/sources';
import { SIMPLE_CATEGORIES } from '../../src/kits/simple/categories';
import { SIMPLE_CSS } from '../../src/kits/simple/styles';
import { SIMPLE_VERSION } from '../../src/kits/simple/version';
import type { KitBuildConfig } from '../lib/buildCatalogue';

const cssClasses = new Set<string>();
for (const m of SIMPLE_CSS.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssClasses.add(m[1]!);

export const simpleBuild: KitBuildConfig & { id: string; version: string } = {
  id: 'simple',
  version: SIMPLE_VERSION,
  label: 'the Simple kit CSS (src/kits/simple/styles.ts)',
  sources,
  overrides,
  categories: SIMPLE_CATEGORIES,
  cssClasses,
  allowedClasses: new Set(),
};
