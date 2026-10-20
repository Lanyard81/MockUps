// Names the single-file build and checks that nothing in it points at the network.
import { readFileSync, renameSync } from 'node:fs';

renameSync('dist-single/index.html', 'dist-single/nsw-mockup-builder.html');
const html = readFileSync('dist-single/nsw-mockup-builder.html', 'utf8');
// Only tags that load something: URLs inside inline NSW strings (e.g. help links) are fine.
const external =
  html.match(
    /<(?:link|script|img)\b[^>]*(?:src|href)=["']https?:\/\/[^"']+|url\(\s*["']?https?:/g,
  ) ?? [];
if (external.length > 0) {
  console.error('Single file references external resources:', external);
  process.exit(1);
}
console.log(
  `dist-single/nsw-mockup-builder.html: ${(html.length / 1024).toFixed(0)} kB, no external links`,
);
