import React, { useEffect, useRef } from 'react';

/**
 * Small centred confirmation modal. Closes on Escape or backdrop tap; focus
 * lands on the confirm button so a keyboard user can act immediately.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'primary', busy = false, onConfirm, onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape' && !busy) onCancel?.(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="cp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel?.(); }}>
      <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-modal-title">
        <h2 id="cp-modal-title">{title}</h2>
        {message && <p>{message}</p>}
        <div className="cp-modal-actions">
          <button type="button" className="cp-btn cp-btn-ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button
            ref={confirmRef}
            type="button"
            className={`cp-btn ${tone === 'danger' ? 'cp-btn-danger' : tone === 'success' ? 'cp-btn-success' : 'cp-btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
