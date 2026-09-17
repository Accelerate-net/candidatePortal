// The historical page URLs and the clean route each one maps to. They are
// still linked from the exam portal, e-mails and bookmarks, so they must keep
// working. Single source for:
//   src/App.jsx            client-side redirects (query string kept)
//   vite.config.js         dev / preview rewrite to index.html
//   scripts/postbuild.mjs  static copies of index.html for GitHub Pages
export const LEGACY_ROUTES = {
  '/dashboard.html': '/performance',
  '/profile.html': '/profile',
  '/report.html': '/report',
  '/weekly-report.html': '/weekly-report',
  '/revisit.html': '/revisit',
  '/weekly-revisit.html': '/weekly-revisit',
  '/course/view-course.html': '/course',
  '/secure-checkout/checkout.html': '/checkout',
};
