import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icons';
import { listCatalog } from '../lib/candidateApi';
import { useUser } from './UserProvider';

const norm = (v) => String(v || '').trim().toLowerCase();
const ROTATE_MS = 5000;

function rupees(paise) {
  const value = Number(paise) / 100;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
}

/**
 * Sales carousel on /test-series: the catalog's test series the candidate does
 * not have yet, one bold slide at a time, rotating every few seconds. Rotation
 * pauses while hovered or focused and is off when the OS asks for reduced
 * motion. Each slide's button puts that series in the checkout cart.
 *
 * exclude: series code(s) never to show (the one open on the page).
 */
export default function SeriesPromoCarousel({ exclude = [] }) {
  const { profile } = useUser() || {};
  const [series, setSeries] = useState(null); // null = loading
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  useEffect(() => {
    let alive = true;
    listCatalog()
      .then((list) => { if (alive) setSeries(list.filter((c) => c.type === 'Test Series')); })
      .catch(() => { if (alive) setSeries([]); });
    return () => { alive = false; };
  }, []);

  const owned = new Set((profile?.courses || []).map((c) => norm(c.title)));
  const excluded = new Set([].concat(exclude).filter(Boolean));
  const slides = (series || []).filter((s) => !owned.has(norm(s.title)) && !excluded.has(s.code));
  const count = slides.length;

  // Keep the index valid when the list changes.
  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);

  // Auto-rotate.
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  if (count === 0) return null;

  const go = (i) => setIndex(((i % count) + count) % count);

  function onTouchStart(e) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  }

  return (
    <section
      className="cp-promo"
      aria-roledescription="carousel"
      aria-label="More test series"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="cp-promo-viewport">
        <div className="cp-promo-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => {
            const free = Number(s.sellingPrice) === 0;
            const cut = s.isDiscountApplicable && Number(s.originalPrice) > Number(s.sellingPrice);
            const saving = cut ? Math.round((1 - Number(s.sellingPrice) / Number(s.originalPrice)) * 100) : 0;
            return (
              <article
                key={s.code}
                className="cp-promo-slide"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={i !== index}
              >
                <div className="cp-promo-glow" aria-hidden="true" />
                <div className="cp-promo-head">
                  <span className="cp-promo-tag">
                    <Icon.Bolt width={12} height={12} />
                    {free ? 'Free to start' : cut ? `Save ${saving}% · limited time` : 'New in the catalog'}
                  </span>
                  {s.photo
                    ? <img className="cp-promo-art" src={s.photo} alt="" loading="lazy" />
                    : <span className="cp-promo-art is-icon"><Icon.Desktop width={22} height={22} /></span>}
                </div>
                <h3 className="cp-promo-title">{s.title}</h3>
                {s.brief && <p className="cp-promo-brief">{s.brief}</p>}
                <div className="cp-promo-foot">
                  <span className="cp-promo-price">
                    <strong>{free ? 'Free' : rupees(s.sellingPrice)}</strong>
                    {cut && <s>{rupees(s.originalPrice)}</s>}
                  </span>
                  <Link className="cp-promo-cta" to={`/checkout?addItem=${encodeURIComponent(s.code)}`} tabIndex={i === index ? 0 : -1}>
                    {free ? 'Get it free' : 'Enroll now'} <Icon.ChevronRight width={15} height={15} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="cp-promo-nav">
          <button type="button" className="cp-promo-arrow" onClick={() => go(index - 1)} aria-label="Previous"><Icon.ChevronLeft width={16} height={16} /></button>
          <div className="cp-promo-dots" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.code}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${s.title}`}
                className={`cp-promo-dot ${i === index ? 'is-active' : ''}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button type="button" className="cp-promo-arrow" onClick={() => go(index + 1)} aria-label="Next"><Icon.ChevronRight width={16} height={16} /></button>
        </div>
      )}
    </section>
  );
}
