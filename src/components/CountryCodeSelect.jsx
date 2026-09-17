import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

/**
 * Country dial-code picker used as the prefix of a phone input. The trigger
 * shows the flag and code; the menu lists flag, country name and code.
 * Keyboard: Enter / Space / arrows open, arrows move, Enter selects, Escape
 * closes, typing a letter jumps to the next country starting with it.
 *
 * countries: [{ code, flag, name }]
 */
export default function CountryCodeSelect({ countries, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const selected = countries.find((c) => c.code === value) || countries[0];

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) setActive(Math.max(0, countries.findIndex((c) => c.code === value)));
  }, [open, countries, value]);

  // Keep the active option visible, and on a short screen, where the menu can
  // open below the fold, bring all of the menu into view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    listRef.current?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function choose(country) {
    setOpen(false);
    triggerRef.current?.focus();
    if (country.code !== value) onChange?.(country.code);
  }

  function onKeyDown(e) {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); if (e.key === 'Escape') e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(countries.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(countries.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (countries[active]) choose(countries[active]); }
    else if (/^[a-z]$/i.test(e.key)) {
      const letter = e.key.toLowerCase();
      const order = [...countries.keys()].map((i) => (active + 1 + i) % countries.length);
      const hit = order.find((i) => countries[i].name.toLowerCase().startsWith(letter));
      if (hit !== undefined) setActive(hit);
    }
  }

  return (
    <div className={`cp-cc ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="cp-cc-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${selected.name} ${selected.code}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="cp-cc-flag" aria-hidden="true">{selected.flag}</span>
        <span className="cp-cc-code">{selected.code}</span>
        <span className="cp-cc-caret"><Icon.ChevronDown width={16} height={16} /></span>
      </button>

      {open && (
        <ul className="cp-cc-menu" role="listbox" ref={listRef} aria-label="Select country code">
          {countries.map((c, i) => (
            <li
              key={c.code}
              role="option"
              aria-selected={c.code === value}
              data-index={i}
              className={`cp-cc-option ${c.code === value ? 'is-selected' : ''} ${i === active ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(c); }}
            >
              <span className="cp-cc-flag" aria-hidden="true">{c.flag}</span>
              <span className="cp-cc-name">{c.name}</span>
              <span className="cp-cc-code">{c.code}</span>
              <span className="cp-cc-check">{c.code === value && <Icon.Check width={14} height={14} />}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
