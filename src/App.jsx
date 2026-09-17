import React, { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ToastProvider from './components/Toast';
import UserProvider, { useUser } from './components/UserProvider';
import ProfilePrompt from './components/ProfilePrompt';
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import { isAuthenticated } from './lib/auth';
import { START_PATH } from './lib/api';
import { LEGACY_ROUTES } from './lib/legacyRoutes';
import { hasAnyEnrolment, hasCourseEnrolment } from './lib/profile';

// The two landing pages (login, courses) ship in the main bundle; every other
// page is its own chunk, so charts, the photo cropper and the checkout only
// download when they are needed. Once the first page is up, the remaining
// chunks are fetched in the background so moving between pages stays instant.
const PAGES = {
  PerformancePage: () => import('./pages/PerformancePage'),
  TestSeriesPage: () => import('./pages/TestSeriesPage'),
  QuizzesPage: () => import('./pages/QuizzesPage'),
  AttendancePage: () => import('./pages/AttendancePage'),
  ProfilePage: () => import('./pages/ProfilePage'),
  ReportPage: () => import('./pages/ReportPage'),
  RevisitPage: () => import('./pages/RevisitPage'),
  CoursePage: () => import('./pages/CoursePage'),
  CheckoutPage: () => import('./pages/CheckoutPage'),
};
const PerformancePage = lazy(PAGES.PerformancePage);
const TestSeriesPage = lazy(PAGES.TestSeriesPage);
const QuizzesPage = lazy(PAGES.QuizzesPage);
const AttendancePage = lazy(PAGES.AttendancePage);
const ProfilePage = lazy(PAGES.ProfilePage);
const ReportPage = lazy(PAGES.ReportPage);
const RevisitPage = lazy(PAGES.RevisitPage);
const CoursePage = lazy(PAGES.CoursePage);
const CheckoutPage = lazy(PAGES.CheckoutPage);

function usePreloadPages() {
  useEffect(() => {
    if (navigator.connection?.saveData) return undefined;
    const preload = () => Object.values(PAGES).forEach((load) => load().catch(() => {}));
    // After the page itself has loaded, so the chunks never compete with it.
    const schedule = () => (window.requestIdleCallback ? window.requestIdleCallback(preload, { timeout: 4000 }) : setTimeout(preload, 2000));
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => window.removeEventListener('load', schedule);
  }, []);
}

// Clean React routes. The historical page URLs (dashboard.html, report.html?…)
// are still linked from the exam portal, e-mails and bookmarks, so each one
// redirects to its clean route with the query string intact.
const DEFAULT_ROUTE = '/courses';
const LEGACY = {
  '/index.html': START_PATH,
  '/dashboard': '/performance',
  ...LEGACY_ROUTES,
};

// Pages that need a session send the candidate to the start page,
// remembering where they were so login can bring them back.
// Pages that need an enrolment: `check` is hasCourseEnrolment (quizzes,
// attendance) or hasAnyEnrolment (my performance). Others are sent to the
// landing page once the profile says so; a profile that failed to load lets
// the page through rather than locking the candidate out.
function Requires({ check, children }) {
  const { profile, loading } = useUser() || {};
  if (loading) return null;
  if (profile && !check(profile)) return <Navigate to={DEFAULT_ROUTE} replace />;
  return children;
}

function Protected({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${START_PATH}?next=${next}`} replace />;
  }
  return (
    <UserProvider>
      {/* Own boundary, so the profile request starts while a page chunk is still loading. */}
      <Suspense fallback={null}>{children}</Suspense>
      <ProfilePrompt />
    </UserProvider>
  );
}

function LegacyRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

export default function App() {
  usePreloadPages();
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <Routes>
          <Route path={START_PATH} element={<LoginPage />} />
          <Route path="/" element={<LegacyRedirect to={START_PATH} />} />
          {Object.entries(LEGACY).map(([from, to]) => <Route key={from} path={from} element={<LegacyRedirect to={to} />} />)}
          <Route path="/performance" element={<Protected><Requires check={hasAnyEnrolment}><PerformancePage /></Requires></Protected>} />
          <Route path="/test-series" element={<Protected><TestSeriesPage /></Protected>} />
          <Route path="/courses" element={<Protected><CoursesPage /></Protected>} />
          <Route path="/quizzes" element={<Protected><Requires check={hasCourseEnrolment}><QuizzesPage /></Requires></Protected>} />
          <Route path="/attendance" element={<Protected><Requires check={hasCourseEnrolment}><AttendancePage /></Requires></Protected>} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/report" element={<Protected><ReportPage variant="exam" /></Protected>} />
          <Route path="/weekly-report" element={<Protected><ReportPage variant="weekly" /></Protected>} />
          <Route path="/revisit" element={<Protected><RevisitPage variant="exam" /></Protected>} />
          <Route path="/weekly-revisit" element={<Protected><RevisitPage variant="weekly" /></Protected>} />
          <Route path="/course" element={<CoursePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}
