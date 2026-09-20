import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { Pill } from './ui';

const tone = (p) => (p >= 85 ? 'lime' : p >= 70 ? 'sky' : 'orange');

/**
 * Attendance month picker: a pill button that opens a styled menu listing
 * every month (newest first) with its present / absent figures, instead of
 * the OS-native <select> list. `months` is attendance months[] from the API.
 */
export default function MonthPicker({ months = [], value, onChange, label = 'Attendance month' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = months.find((m) => m.key === value) || months[0];

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
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

  if (!current) return null;

  return (
    <div className={`cp-monthpick ${open ? 'is-open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="cp-monthpick-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon.Calendar width={15} height={15} />
        <span>{current.label}</span>
        <span className="cp-monthpick-caret"><Icon.ChevronDown width={16} height={16} /></span>
      </button>

      {open && (
        <div className="cp-monthpick-menu" role="listbox" aria-label={label}>
          <div className="cp-monthpick-title">Choose month</div>
          {months.map((m) => {
            const active = m.key === current.key;
            return (
              <button
                key={m.key}
                type="button"
                role="option"
                aria-selected={active}
                className={`cp-monthpick-item ${active ? 'is-active' : ''}`}
                onClick={() => { onChange(m.key); setOpen(false); }}
              >
                <span className="cp-monthpick-meta">
                  <strong>{m.label}</strong>
                  <small>{m.total > 0 ? `${m.present} present · ${m.absent} absent` : 'No classes'}</small>
                </span>
                {m.total > 0 && <Pill tone={tone(m.percent)} size="sm">{m.percent}%</Pill>}
                {active && <span className="cp-monthpick-check"><Icon.Check width={14} height={14} /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
