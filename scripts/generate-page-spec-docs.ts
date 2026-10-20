/**
 * Writes docs/PAGE-SPEC.md from the kit catalogues and settings definitions.
 * Run with `npm run page-spec-docs` (through Vite, like the samples script).
 */
import { JSDOM } from 'jsdom';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The generator reads each variant's markup, which needs a DOM.
const dom = new JSDOM('');
Object.assign(globalThis, { document: dom.window.document, window: dom.window });

const { generatePageSpecDoc } = await import('../src/pagespec/docs');
const file = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/PAGE-SPEC.md');
const text = generatePageSpecDoc();
writeFileSync(file, text);
console.log(`docs/PAGE-SPEC.md (${(text.length / 1024).toFixed(0)} kB)`);
