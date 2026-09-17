import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

/**
 * Dropdown whose trigger and options are rich tiles: image, title, badges
 * and a meta line. Keyboard: Enter / Space / ArrowDown open, arrows move,
 * Enter selects, Escape closes. Closes on outside click.
 *
 * items: [{ id, title, image, fallbackIcon, badges: [{ label, tone, icon }], meta: [string], stats: [{ value, label }] }]
 * variant "cover" shows the selection as a page cover with a "Switch" button.
 */
function Tile({ item, compact = false }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [item.image]);
  const Fallback = item.fallbackIcon || Icon.Desktop;
  return (
    <>
      <span className={`cp-tile-thumb ${item.image && !broken ? '' : 'is-icon'}`}>
        {item.image && !broken
          ? <img src={item.image} alt="" onError={() => setBroken(true)} />
          : <Fallback width={22} height={22} />}
      </span>
      <span className="cp-tile-body">
        <strong className="cp-tile-title">{item.title}</strong>
        {item.badges?.length > 0 && (
          <span className="cp-tile-badges">
            {item.badges.map((b) => {
              const BadgeIcon = b.icon;
              return (
                <span key={b.label} className={`cp-pill cp-pill-sm is-${b.tone || 'ghost'}`}>
                  <span>{BadgeIcon && <BadgeIcon width={12} height={12} />} {b.label}</span>
                </span>
              );
            })}
          </span>
        )}
        {!compact && item.meta?.length > 0 && <small className="cp-tile-meta">{item.meta.filter(Boolean).join(' · ')}</small>}
        {compact && item.meta?.length > 0 && <small className="cp-tile-meta">{item.meta.filter(Boolean).join(' · ')}</small>}
      </span>
    </>
  );
}

// Cover header (like a page cover): banner artwork, overlapping thumbnail,
// title, badges, counters, and a "Switch" button that opens the same menu.
function Cover({ item, eyebrow, children }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [item?.image]);
  const hasImage = item?.image && !broken;
  const Fallback = item?.fallbackIcon || Icon.Desktop;
  // `coverMeta` lets the cover skip what its counters already say.
  const meta = (item?.coverMeta || item?.meta || []).filter(Boolean);
  return (
    <div className="cp-cover">
      <div className={`cp-cover-banner ${hasImage ? '' : 'is-plain'}`} style={hasImage ? { backgroundImage: `url("${item.image}")` } : undefined} aria-hidden="true" />
      <div className="cp-cover-body">
        <span className={`cp-cover-thumb ${hasImage ? '' : 'is-icon'}`}>
          {hasImage ? <img src={item.image} alt="" onError={() => setBroken(true)} /> : <Fallback width={30} height={30} />}
        </span>
        <div className="cp-cover-text">
          {eyebrow && <small className="cp-cover-eyebrow">{eyebrow}</small>}
          <h1 className="cp-cover-title">{item?.title}</h1>
          {(item?.badges?.length > 0 || meta.length > 0) && (
            <div className="cp-cover-meta">
              {item.badges?.map((b) => {
                const BadgeIcon = b.icon;
                return (
                  <span key={b.label} className={`cp-pill cp-pill-sm is-${b.tone || 'ghost'}`}>
                    <span>{BadgeIcon && <BadgeIcon width={12} height={12} />} {b.label}</span>
                  </span>
                );
              })}
              {meta.map((m) => <small key={m}>{m}</small>)}
            </div>
          )}
        </div>
        {item?.stats?.length > 0 && (
          <dl className="cp-cover-stats">
            {item.stats.map((st) => <div key={st.label}><dt>{st.value}</dt><dd>{st.label}</dd></div>)}
          </dl>
        )}
        {children}
      </div>
    </div>
  );
}

export default function TileDropdown({ items, value, onChange, label, placeholder = 'Select', variant = 'tile', switchLabel = 'Switch' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const selected = items.find((i) => i.id === value) || null;

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, items.findIndex((i) => i.id === value));
    setActive(idx);
  }, [open, items, value]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function choose(item) {
    setOpen(false);
    if (item.id !== value) onChange?.(item.id);
  }

  function onKeyDown(e) {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[active]) choose(items[active]); }
  }

  const menu = open && (
    <ul className="cp-tiledd-menu" role="listbox" ref={listRef} aria-label={label || placeholder}>
      {items.map((item, i) => (
        <li
          key={item.id}
          role="option"
          aria-selected={item.id === value}
          data-index={i}
          className={`cp-tiledd-option ${item.id === value ? 'is-selected' : ''} ${i === active ? 'is-active' : ''}`}
          onMouseEnter={() => setActive(i)}
          onMouseDown={(e) => { e.preventDefault(); choose(item); }}
        >
          <Tile item={item} />
          {item.id === value && <span className="cp-tiledd-check"><Icon.Check width={14} height={14} /></span>}
        </li>
      ))}
    </ul>
  );

  if (variant === 'cover') {
    return (
      <div className={`cp-tiledd is-cover ${open ? 'is-open' : ''}`}>
        <Cover item={selected || { title: placeholder }} eyebrow={label}>
          {items.length > 1 && (
            <div className="cp-cover-switch" ref={rootRef}>
              <button
                type="button"
                className="cp-btn cp-btn-light cp-btn-sm cp-btn-bordered"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={onKeyDown}
              >
                {switchLabel} <b>{items.length}</b>
                <span className="cp-cover-caret"><Icon.ChevronDown width={16} height={16} /></span>
              </button>
              {menu}
            </div>
          )}
        </Cover>
      </div>
    );
  }

  return (
    <div className={`cp-tiledd ${open ? 'is-open' : ''}`} ref={rootRef}>
      {label && <span className="cp-label" id="cp-tiledd-label">{label}</span>}
      <button
        type="button"
        className="cp-tiledd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? 'cp-tiledd-label' : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        {selected ? <Tile item={selected} /> : <span className="cp-tile-body"><strong className="cp-tile-title">{placeholder}</strong></span>}
        <span className="cp-tiledd-caret"><Icon.ChevronDown width={18} height={18} /></span>
      </button>

      {menu}
    </div>
  );
}
