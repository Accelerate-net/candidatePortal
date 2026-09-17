import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/auth';
import { START_PATH } from '../lib/api';
import { Icon } from './Icons';
import { Avatar } from './ui';
import ConfirmDialog from './ConfirmDialog';
import { useUser } from './UserProvider';
import { hasAnyEnrolment, hasCourseEnrolment, isOfflineStudent } from '../lib/profile';

export const NAV = [
  { path: '/courses', label: 'Courses', short: 'Courses', icon: Icon.Book },
  { path: '/performance', label: 'My Performance', short: 'Scores', icon: Icon.Grid, needsEnrolment: true },
  { path: '/quizzes', label: 'Quizzes', short: 'Quizzes', icon: Icon.FileText, needsCourse: true },
  { path: '/test-series', label: 'Test Series', short: 'Tests', icon: Icon.Desktop },
  { path: '/attendance', label: 'Attendance', short: 'Attendance', icon: Icon.Calendar, needsOffline: true },
  { path: '/profile', label: 'Profile', short: 'Profile', icon: Icon.User, tab: false },
];

const LOGO = '/logo/crispr-logo.svg';

// Phones and tablets: the avatar at the top right opens a small menu that
// points up at the picture. Closes on outside click, Escape, or a choice.
function ProfileMenu({ photo, name, pending, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="cp-profile-menu cp-pagehead-mobile" ref={rootRef}>
      <button type="button" className="cp-icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((o) => !o)}>
        <Avatar src={photo} size="sm" pending={pending} />
      </button>
      {open && (
        <div className="cp-profile-pop" role="menu">
          {name && <small className="cp-profile-pop-name">{name}</small>}
          <NavLink role="menuitem" className="cp-profile-pop-item" to="/profile" onClick={() => setOpen(false)}>
            <Icon.User width={17} height={17} /> My Profile
          </NavLink>
          <button type="button" role="menuitem" className="cp-profile-pop-item is-danger" onClick={() => { setOpen(false); onLogout(); }}>
            <Icon.Logout width={17} height={17} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * App shell. Desktop: left sidebar. Mobile: bottom tab bar. Every page starts
 * with an in-flow heading; `backTo` adds a link back (report and revisit pages)
 * and `user` overrides the profile shown in the shell.
 */
export default function Layout({ title, hideTitle = false, backTo, user, children }) {
  const navigate = useNavigate();
  const { profile, loading } = useUser() || {};
  const me = user || profile || {};
  // Quizzes only show for candidates enrolled in a course (not for
  // test-series-only accounts); My Performance needs any enrolment at all;
  // Attendance is for offline (classroom) students, `offlineOnboarded`.
  const nav = NAV.filter((n) => (!n.needsCourse || hasCourseEnrolment(profile))
    && (!n.needsEnrolment || hasAnyEnrolment(profile))
    && (!n.needsOffline || isOfflineStudent(profile)));
  const pendingPhoto = !user?.name && !profile && Boolean(loading);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    document.title = `${title} · Crispr Learning`;
  }, [title]);

  function logoutNow() {
    clearToken();
    navigate(START_PATH, { replace: true });
  }

  const navLink = (isActive) => `cp-nav-link ${isActive ? 'is-active' : ''}`;
  const tabLink = (isActive) => `cp-tab ${isActive ? 'is-active' : ''}`;

  return (
    <div className="cp-shell">
      <ConfirmDialog
        open={confirmOpen}
        title="Sign out?"
        message="You will need your mobile number and a new OTP to sign in again."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        onConfirm={logoutNow}
        onCancel={() => setConfirmOpen(false)}
      />

      <aside className="cp-sidebar">
        <NavLink className="cp-brand-logo" to="/courses"><img src={LOGO} alt="Crispr Learning" /></NavLink>

        <nav className="cp-nav" aria-label="Primary">
          {nav.map(({ path, label, icon: Ico }) => (
            <NavLink key={path} to={path} className={({ isActive }) => navLink(isActive)}>
              <Ico />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="cp-sidebar-foot">
          <NavLink className="cp-user-strip" to="/profile">
            <Avatar src={me.photo} size="sm" pending={pendingPhoto} />
            <div>
              <strong>{me.name || 'Candidate'}</strong>
              <small>{me.aspiration || 'Crispr Learning'}</small>
            </div>
          </NavLink>
          <button type="button" className="cp-nav-link cp-nav-logout" onClick={() => setConfirmOpen(true)}>
            <Icon.Logout />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="cp-main">
        <main className="cp-content">
          {/* Page heading (replaces the old top bar). On phones it also carries
              the profile menu, which the sidebar covers on desktop. */}
          <div className={`cp-pagehead ${hideTitle ? 'is-untitled' : ''}`}>
            {/* `hideTitle` keeps the title for the browser tab only. */}
            {hideTitle ? <span /> : <h1 className="cp-pagehead-title">{title}</h1>}
            <div className="cp-pagehead-actions">
              {backTo && (
                <NavLink className="cp-btn cp-btn-ghost cp-btn-sm" to={backTo.path}>
                  <Icon.ChevronLeft width={16} height={16} />
                  {backTo.label}
                </NavLink>
              )}
              <ProfileMenu photo={me.photo} name={me.name} pending={pendingPhoto} onLogout={() => setConfirmOpen(true)} />
            </div>
          </div>
          {children}
        </main>

        <footer className="cp-foot" role="contentinfo">&copy; 2026 Crispr Learning</footer>

        <nav className="cp-tabbar" aria-label="Primary">
          {nav.filter((n) => n.tab !== false).map(({ path, short, icon: Ico }) => (
            <NavLink key={path} to={path} className={({ isActive }) => tabLink(isActive)}>
              <Ico />
              <span>{short}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
