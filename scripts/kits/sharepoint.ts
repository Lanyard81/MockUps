import { overrides } from '../../src/kits/sharepoint/catalogue/overrides';
import { sources } from '../../src/kits/sharepoint/catalogue/sources';
import { SP_CATEGORIES } from '../../src/kits/sharepoint/categories';
import { SP_CSS } from '../../src/kits/sharepoint/styles';
import { SP_VERSION } from '../../src/kits/sharepoint/version';
import type { KitBuildConfig } from '../lib/buildCatalogue';

const cssClasses = new Set<string>();
for (const m of SP_CSS.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssClasses.add(m[1]!);

export const spBuild: KitBuildConfig & { id: string; version: string } = {
  id: 'sharepoint',
  version: SP_VERSION,
  label: 'the SharePoint kit CSS (src/kits/sharepoint/styles.ts)',
  sources,
  overrides,
  categories: SP_CATEGORIES,
  cssClasses,
  allowedClasses: new Set(),
};
