// After `vite build`, copy dist/index.html to every legacy page path so a
// static host (GitHub Pages) serves /dashboard.html, /report.html?attemptId=…
// and friends directly, without a 404 redirect hop.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LEGACY_ROUTES } from '../src/lib/legacyRoutes.js';

const DIST = join(process.cwd(), 'dist');
const ROUTES = [...Object.keys(LEGACY_ROUTES).map((path) => path.slice(1)), '404.html'];

for (const route of ROUTES) {
  const target = join(DIST, route);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(DIST, 'index.html'), target);
}
console.log(`postbuild: wrote ${ROUTES.length} legacy entry pages into dist/`);
