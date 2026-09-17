import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icons';
import { listCatalog } from '../lib/candidateApi';
import { useUser } from './UserProvider';

const norm = (v) => String(v || '').trim().toLowerCase();

function rupees(paise) {
  const value = Number(paise) / 100;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
}

function Thumb({ src }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={`cp-series-tile-thumb ${src && !broken ? '' : 'is-icon'}`}>
      {src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : <Icon.Desktop width={32} height={32} />}
    </span>
  );
}

/**
 * Test series available in the catalog, as a row of small tiles that scrolls
 * sideways. A series the candidate already has opens it; any other goes to the
 * checkout with that series in the cart.
 */
export default function CatalogSeries() {
  const { profile } = useUser() || {};
  const [series, setSeries] = useState(null); // null = loading

  useEffect(() => {
    let alive = true;
    listCatalog()
      .then((list) => { if (alive) setSeries(list.filter((c) => c.type === 'Test Series')); })
      .catch(() => { if (alive) setSeries([]); });
    return () => { alive = false; };
  }, []);

  if (series !== null && series.length === 0) return null;

  // The profile lists enrolled courses by title.
  const owned = new Set((profile?.courses || []).map((c) => norm(c.title)));

  return (
    <section className="cp-series-strip" aria-label="Test series">
      <div className="cp-series-strip-head">
        <h2>Test series</h2>
        {series && <small>{series.length} available</small>}
      </div>
      <div className="cp-series-row">
        {series === null && [0, 1, 2].map((i) => <div key={i} className="cp-skeleton cp-series-tile is-loading" aria-busy="true" />)}
        {series?.map((s) => {
          const enrolled = owned.has(norm(s.title));
          const free = Number(s.sellingPrice) === 0;
          const cut = s.isDiscountApplicable && Number(s.originalPrice) > Number(s.sellingPrice);
          return (
            <Link key={s.code} className="cp-series-tile" to={enrolled ? `/test-series?id=${encodeURIComponent(s.code)}` : `/checkout?addItem=${encodeURIComponent(s.code)}`}>
              <Thumb src={s.photo} />
              <strong className="cp-series-tile-title">{s.title}</strong>
              <span className="cp-series-tile-foot">
                {enrolled
                  ? <span className="cp-series-tile-owned"><Icon.Check width={12} height={12} /> Enrolled</span>
                  : <span className="cp-series-tile-price">{free ? 'Free' : rupees(s.sellingPrice)}{cut && <s>{rupees(s.originalPrice)}</s>}</span>}
                <span className="cp-series-tile-cta">{enrolled ? 'Open' : 'Enroll'} <Icon.ChevronRight width={12} height={12} /></span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
