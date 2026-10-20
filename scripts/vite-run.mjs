// Runs a TypeScript script through Vite, so it can import the app's modules the way the app does
// (including `?raw` CSS and `?url` fonts), which plain `tsx` can't. Usage: node scripts/vite-run.mjs <script.ts>
import { createServer } from 'vite';

const script = process.argv[2];
if (!script) {
  console.error('Usage: node scripts/vite-run.mjs <script.ts>');
  process.exit(2);
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  logLevel: 'error',
});
try {
  await server.ssrLoadModule(`/${script.replace(/^\.?\//, '')}`);
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await server.close();
}
