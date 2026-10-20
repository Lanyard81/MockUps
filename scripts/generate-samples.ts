/**
 * Writes the sample mockups to public/samples/*.mockup.json from each kit's `samples`.
 * The output is deterministic (fixed ids and date), so `git diff` shows whether it is up to date.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serialiseMockupFile } from '../src/persistence/schema';
import { KITS } from '../src/kits';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/samples');
mkdirSync(dir, { recursive: true });
for (const def of KITS.flatMap((k) => k.samples)) {
  const text = serialiseMockupFile(def.build(), [], '2026-10-20T00:00:00.000Z') + '\n';
  writeFileSync(resolve(dir, `${def.id}.mockup.json`), text);
  console.log(`public/samples/${def.id}.mockup.json (${(text.length / 1024).toFixed(0)} kB)`);
}
