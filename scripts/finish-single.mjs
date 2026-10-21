// Names the single-file build and checks that nothing in it points at the network.
import { readFileSync, renameSync } from 'node:fs';

renameSync('dist-single/index.html', 'dist-single/mockmaker.html');
const full = readFileSync('dist-single/mockmaker.html', 'utf8');
// Script bodies are the app's own code: they contain markup strings (e.g. the CDN HTML export) that
// are written into exported pages, never loaded here. The script tags themselves are still checked.
const html = full.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/g, '$1</script>');
// Only tags that load something: URLs inside inline NSW strings (e.g. help links) are fine.
const external =
  html.match(
    /<(?:link|script|img)\b[^>]*(?:src|href)=["']https?:\/\/[^"']+|url\(\s*["']?https?:/g,
  ) ?? [];
if (external.length > 0) {
  console.error('Single file references external resources:', external);
  process.exit(1);
}
console.log(`dist-single/mockmaker.html: ${(full.length / 1024).toFixed(0)} kB, no external links`);
