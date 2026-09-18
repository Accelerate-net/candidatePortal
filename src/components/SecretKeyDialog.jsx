import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

/**
 * Asks for the numeric secret key of a locked quiz. `onSubmit(secret)` returns
 * a promise; a rejection or a resolved string is shown as the error and the
 * dialog stays open so the candidate can try again.
 */
export default function SecretKeyDialog({ open, title = 'Enter the secret key', message, onSubmit, onCancel }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setSecret(''); setError(''); setBusy(false);
    inputRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape' && !busy) onCancel?.(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const value = secret.trim();
    if (!/^\d+$/.test(value)) { setError('Enter the number key you were given.'); inputRef.current?.focus(); return; }
    setBusy(true); setError('');
    try {
      const failure = await onSubmit(value);
      if (failure) { setError(failure); setBusy(false); inputRef.current?.focus(); }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="cp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel?.(); }}>
      <form className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-secret-title" onSubmit={handleSubmit} noValidate>
        <div className="cp-modal-head">
          <span className="cp-state-icon"><Icon.Lock /></span>
          <div>
            <h2 id="cp-secret-title">{title}</h2>
            <p>{message || 'This exam is locked. Enter the number key shared with you to continue.'}</p>
          </div>
        </div>

        <label className="cp-field">
          <span>Secret key</span>
          <input
            ref={inputRef}
            className="cp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={12}
            placeholder="e.g. 249295"
            value={secret}
            onChange={(e) => { setSecret(e.target.value.replace(/\D/g, '')); setError(''); }}
            disabled={busy}
          />
        </label>
        {error && <div className="cp-alert cp-alert-error" role="alert">{error}</div>}

        <div className="cp-modal-actions">
          <button type="button" className="cp-btn cp-btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="cp-btn cp-btn-primary" disabled={busy || !secret}>{busy ? 'Checking…' : 'Continue'}</button>
        </div>
      </form>
    </div>
  );
}
