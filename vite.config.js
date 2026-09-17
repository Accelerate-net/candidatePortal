import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { LEGACY_ROUTES } from './src/lib/legacyRoutes.js';

// The portal keeps its historical page URLs (dashboard.html, report.html, …)
// because the exam portal, e-mails and bookmarks link to them. They are all
// served by the single index.html and resolved client-side by React Router.
//   dev / preview: this middleware rewrites them to index.html.
//   build:         scripts/postbuild.mjs copies dist/index.html to each path,
//                  so GitHub Pages serves them without a 404 hop.
const LEGACY_PATHS = ['/index.html', ...Object.keys(LEGACY_ROUTES)];

function legacyRoutes() {
  const rewrite = (server) => {
    server.middlewares.use((req, _res, next) => {
      const path = (req.url || '').split('?')[0];
      if (LEGACY_PATHS.includes(path)) req.url = '/index.html' + (req.url.slice(path.length) || '');
      next();
    });
  };
  return { name: 'legacy-html-routes', configureServer: rewrite, configurePreviewServer: rewrite };
}

export default defineConfig({
  plugins: [react(), legacyRoutes()],
  server: {
    port: 5175,
    open: '/dashboard.html',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // React and the router change far less often than the app, so they get
        // their own long-cached chunk. Everything else is split per lazy page.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
});
