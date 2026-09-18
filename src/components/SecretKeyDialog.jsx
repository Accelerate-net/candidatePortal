import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

const KEY_LENGTH = 6;

/**
 * Asks for the numeric key of a locked quiz, one box per digit like the login
 * OTP. `onSubmit(secret)` returns a value or a promise; a rejection or a
 * resolved string is shown as the error and the dialog stays open so the
 * candidate can try again.
 */
export default function SecretKeyDialog({ open, title = 'Enter the secret key', message, onSubmit, onCancel }) {
  const [digits, setDigits] = useState(Array(KEY_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRefs = useRef([]);
  const secret = digits.join('');
  // The first empty box (or the last one when the key is complete).
  const focusOpenBox = () => inputRefs.current[Math.min(secret.length, KEY_LENGTH - 1)]?.focus();

  useEffect(() => {
    if (!open) return undefined;
    setDigits(Array(KEY_LENGTH).fill('')); setError(''); setBusy(false);
    inputRefs.current[0]?.focus();
    function onKey(e) { if (e.key === 'Escape' && !busy) onCancel?.(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    const value = secret;
    if (value.length !== KEY_LENGTH) { setError(`Enter all ${KEY_LENGTH} digits of the key you were given.`); focusOpenBox(); return; }
    setBusy(true); setError('');
    try {
      const failure = await onSubmit(value);
      if (failure) setError(failure);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    }
    setBusy(false);
  }

  // Typing fills the box and moves on; a paste of the whole key fills them all.
  function handleInput(index, e) {
    let typed = e.target.value.replace(/\D/g, '');
    setError('');
    // A digit typed over a filled box replaces it.
    if (typed.length === 2 && digits[index] && typed.includes(digits[index])) typed = typed[0] === digits[index] ? typed[1] : typed[0];
    if (typed.length > 1) {
      setDigits((current) => {
        const next = [...current];
        typed.slice(0, KEY_LENGTH - index).split('').forEach((d, i) => { next[index + i] = d; });
        return next;
      });
      inputRefs.current[Math.min(index + typed.length, KEY_LENGTH - 1)]?.focus();
      return;
    }
    setDigits((current) => { const next = [...current]; next[index] = typed; return next; });
    if (typed && index < KEY_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      setDigits((current) => { const next = [...current]; next[index - 1] = ''; return next; });
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < KEY_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  // Back to the field once it is enabled again after a failed try.
  useEffect(() => { if (open && !busy && error) focusOpenBox(); }, [open, busy, error]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

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

        <div className="cp-field" role="group" aria-labelledby="cp-secret-label">
          <span id="cp-secret-label">Exam Start Key</span>
          <div className="cp-otp cp-otp-key">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                className="otpEntry"
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Key digit ${i + 1}`}
                value={digit}
                onChange={(e) => handleInput(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                disabled={busy}
              />
            ))}
          </div>
        </div>
        {error && <div className="cp-alert cp-alert-error" role="alert">{error}</div>}

        <div className="cp-modal-actions">
          <button type="button" className="cp-btn cp-btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="cp-btn cp-btn-primary" disabled={busy || secret.length !== KEY_LENGTH}>{busy ? 'Checking…' : 'Continue'}</button>
        </div>
      </form>
    </div>
  );
}
