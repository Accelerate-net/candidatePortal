import React, { useEffect } from 'react';
import { Icon } from './Icons';
import CatalogSeries from './CatalogSeries';

/**
 * "Explore all" popup on /test-series: every test series in the catalog, as
 * the same tiles the courses page shows. Escape, the close button and the
 * backdrop close it; picking a series closes it too. `onOpen(code)` opens a
 * series the candidate already has without leaving the page.
 */
export default function ExploreSeriesDialog({ open, onClose, onOpen }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="cp-modal cp-explore-modal" role="dialog" aria-modal="true" aria-labelledby="cp-explore-title">
        <div className="cp-explore-head">
          <div>
            <h2 id="cp-explore-title">All test series</h2>
            <p>Open a series you have, or enroll in a new one.</p>
          </div>
          <button type="button" className="cp-icon-btn" onClick={onClose} aria-label="Close"><Icon.X width={18} height={18} /></button>
        </div>
        <CatalogSeries layout="grid" onNavigate={onClose} onOpen={onOpen} />
      </div>
    </div>
  );
}
