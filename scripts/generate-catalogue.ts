/**
 * Builds each kit's catalogue (src/kits/<id>/catalogue/generated/catalogue.json) from its
 * hand-written sources and curated overrides, checking them against the kit's own CSS and
 * JavaScript. Fails (exit 1) on any mismatch, so upgrading a design-system package and re-running
 * it shows exactly what moved.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Catalogue } from '../src/catalogue/types';
import { buildCatalogue } from './lib/buildCatalogue';
import { nswBuild, nswIcons } from './kits/nsw';
import { spBuild } from './kits/sharepoint';
import { simpleBuild } from './kits/simple';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const kits = [nswBuild, spBuild, simpleBuild];
let failed = false;

for (const kit of kits) {
  const { components, errors } = buildCatalogue(kit);
  if (errors.length > 0) {
    console.error(
      `Catalogue check failed for ${kit.id} against ${kit.label}:\n` +
        errors.map((e) => `  - ${e}`).join('\n'),
    );
    failed = true;
    continue;
  }
  const catalogue: Catalogue = { version: kit.version, components };
  const dir = resolve(root, `src/kits/${kit.id}/catalogue/generated`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'catalogue.json'), JSON.stringify(catalogue, null, 1) + '\n');
  if (kit.id === 'nsw')
    writeFileSync(resolve(dir, 'icons.json'), JSON.stringify(nswIcons(root)) + '\n');

  const variants = components.reduce((n, c) => n + c.variants.length, 0);
  const notFull = components.filter((c) => c.fidelity !== 'full');
  console.log(`Catalogue ${kit.id}: ${components.length} components, ${variants} variants`);
  console.log(
    `  Not fully faithful on the canvas: ${notFull.map((c) => `${c.id} (${c.fidelity})`).join(', ') || 'none'}`,
  );
}
if (failed) process.exit(1);
