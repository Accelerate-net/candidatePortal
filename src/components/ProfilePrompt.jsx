import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from './Icons';
import { useToast } from './Toast';
import { useUser } from './UserProvider';
import { getCookie, setCookie } from '../lib/browser';
import { updateProfile as saveProfileApi } from '../lib/candidateApi';
import { PLACES, buildProfilePayload, isNameMissing, isValidName, missingProfileFields } from '../lib/profile';

// Skipping the optional prompt snoozes it with this cookie; it expires after
// SNOOZE_DAYS, so the prompt comes back if the details are still missing.
const SNOOZE_COOKIE = 'cp_profile_prompted';
const SNOOZE_DAYS = 5;

const wasPrompted = () => getCookie(SNOOZE_COOKIE) === '1';
const markPrompted = () => setCookie(SNOOZE_COOKIE, '1', SNOOZE_DAYS);

/**
 * Opens once the profile has loaded when the name, email or place is not set.
 *   Name missing (empty or the "Crisprite" placeholder): mandatory. The dialog
 *   cannot be dismissed until a name is saved.
 *   Only email / place missing: optional. "Later" hides it for five days.
 */
export default function ProfilePrompt() {
  const toast = useToast();
  const location = useLocation();
  const { profile, loading, updateProfile } = useUser() || {};
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', place: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const placeRef = useRef(null);

  const nameMissing = isNameMissing(profile);
  const missing = missingProfileFields(profile);

  // Decide whether to open, once the profile is in.
  useEffect(() => {
    if (loading || !profile || open) return;
    const onProfilePage = location.pathname === '/profile';
    if (nameMissing || (missing.length > 0 && !wasPrompted() && !onProfilePage)) {
      setForm({ name: nameMissing ? '' : profile.name || '', email: profile.email || '', place: profile.place || '' });
      setError('');
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile, location.pathname]);

  // On open, focus the first field that still needs filling in.
  useEffect(() => {
    if (!open) return undefined;
    const target = !form.name.trim() ? nameRef : !form.email.trim() ? emailRef : !form.place ? placeRef : nameRef;
    const t = setTimeout(() => target.current?.focus(), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock scrolling; Escape only closes the optional variant.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === 'Escape' && !nameMissing && !busy) later(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nameMissing, busy]);

  if (!open) return null;

  function later() {
    markPrompted();
    setOpen(false);
  }

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    if (!isValidName(name)) { setError('Please enter your full name.'); nameRef.current?.focus(); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address, or leave it empty.'); emailRef.current?.focus(); return; }
    setBusy(true); setError('');
    const next = { ...profile, name, email, place: form.place };
    try {
      const res = await saveProfileApi(buildProfilePayload(next));
      if (res.status === 'success') {
        updateProfile?.(next);
        markPrompted();
        setOpen(false);
        toast('Profile has been updated');
      } else {
        setError(res.message || res.error || 'Could not save your details. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Could not save your details. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !nameMissing && !busy) later(); }}>
      <form className="cp-modal cp-profile-modal" role="dialog" aria-modal="true" aria-labelledby="cp-profile-prompt-title" onSubmit={handleSubmit} noValidate>
        <div className="cp-modal-head">
          <span className="cp-state-icon"><Icon.User /></span>
          <div>
            <h2 id="cp-profile-prompt-title">{nameMissing ? 'Tell us your name' : 'Complete your profile'}</h2>
            <p>
              {nameMissing
                ? 'Your name goes on your reports and ID card, so we need it before you continue. Email and place are optional.'
                : 'Add your email and place so we can reach you about exams and results. You can skip this for now.'}
            </p>
          </div>
        </div>

        <label className="cp-field">
          <span>Full name <em className="cp-req">required</em></span>
          <input ref={nameRef} className="cp-input" type="text" autoComplete="name" maxLength={80} placeholder="Your full name" value={form.name} onChange={set('name')} />
        </label>
        <label className="cp-field">
          <span>Email <em className="cp-opt">optional</em></span>
          <input ref={emailRef} className="cp-input" type="email" inputMode="email" autoComplete="email" maxLength={80} placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </label>
        <label className="cp-field">
          <span>Place <em className="cp-opt">optional</em></span>
          <span className="cp-select-wrap">
            <select ref={placeRef} className="cp-select" value={form.place} onChange={set('place')}>
              <option value="">Not Known</option>
              {Object.entries(PLACES).map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((item) => (Array.isArray(item)
                    ? <option key={item[0]} value={item[0]}>{item[1]}</option>
                    : <option key={item} value={item}>{item}</option>))}
                </optgroup>
              ))}
            </select>
            <Icon.ChevronDown width={16} height={16} />
          </span>
        </label>

        {error && <div className="cp-alert cp-alert-error" role="alert">{error}</div>}

        <div className="cp-modal-actions">
          {!nameMissing && <button type="button" className="cp-btn cp-btn-ghost" onClick={later} disabled={busy}>Later</button>}
          <button type="submit" className="cp-btn cp-btn-primary" disabled={busy || !isValidName(form.name)}>
            {busy ? 'Saving…' : 'Save and continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
