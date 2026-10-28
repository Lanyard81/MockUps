// Fails when editor styles use a literal colour or a font size under 12px outside the token files.
// Tokens live in src/styles/theme.css, devdan.css and flat.css; everything else asks for a token.
// A line ending in "token-ok: reason" is exempt (for a value that is data, not a style).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN_FILES = new Set(['theme.css', 'devdan.css', 'flat.css']);
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\((?!var\()|\bhsla?\(/;
const VAR_CHANNELS = /rgba?\(\s*var\(/;
const SMALL_FONT = /font-size:\s*(\d+(?:\.\d+)?)px|font:[^;]*?\b(\d+(?:\.\d+)?)px/;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(css|tsx)$/.test(name) && !TOKEN_FILES.has(name)) yield path;
  }
}

const problems = [];
for (const root of ['src/styles', 'src/app', 'src/canvas']) {
  for (const path of files(root)) {
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (line.includes('token-ok') || /^\s*(\/\/|\/\*|\*)/.test(line)) return;
        const text = line.replace(/var\([^)]*\)/g, 'var()');
        if (COLOUR.test(text) && !VAR_CHANNELS.test(line))
          problems.push(`${path}:${i + 1}: literal colour: ${line.trim()}`);
        const m = SMALL_FONT.exec(line);
        const size = m ? Number(m[1] ?? m[2]) : NaN;
        if (path.endsWith('.css') && size < 12)
          problems.push(`${path}:${i + 1}: font size under 12px: ${line.trim()}`);
      });
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s). Use a token from src/styles/theme.css.`);
  process.exit(1);
}
console.log('Editor styles use tokens only.');
