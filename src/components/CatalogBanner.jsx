import React, { useState } from 'react';
import { Icon } from './Icons';
import { getCookie, setCookie } from '../lib/browser';

export const CATALOG_URL = 'https://crisprlearning.com/courses/';

// Closing the slim strip hides it for this long (cookie).
const DISMISS_COOKIE = 'cp_catalog_strip_closed';
const DISMISS_DAYS = 14;

const PERKS = [
  { icon: Icon.PlayCircle, text: 'Chapter-wise video lessons for every subject' },
  { icon: Icon.Desktop, text: 'Full-length IAT mock tests with detailed reports' },
  { icon: Icon.FileText, text: 'PYQ solutions and weekly quizzes' },
];

/**
 * Invitation to the course catalog. Full size for candidates with no course
 * yet; `compact` is a slim one-line strip for those already enrolled, which
 * can be closed and then stays away for 14 days.
 */
export default function CatalogBanner({ compact = false }) {
  const [closed, setClosed] = useState(() => getCookie(DISMISS_COOKIE) === '1');

  if (compact) {
    if (closed) return null;
    return (
      <div className="cp-catalog-strip">
        <a className="cp-catalog-strip-link" href={CATALOG_URL} target="_blank" rel="noopener noreferrer">
          <span className="cp-catalog-strip-icon"><Icon.Graduation width={16} height={16} /></span>
          <span className="cp-catalog-strip-text"><b>Add to your prep.</b> Explore more courses and test series in our catalog.</span>
          <span className="cp-catalog-strip-cta">Browse <Icon.ChevronRight width={14} height={14} /></span>
        </a>
        <button
          type="button"
          className="cp-catalog-strip-close"
          aria-label="Close. Hidden for 14 days."
          title="Close"
          onClick={() => { setCookie(DISMISS_COOKIE, '1', DISMISS_DAYS); setClosed(true); }}
        >
          <Icon.X width={14} height={14} />
        </button>
      </div>
    );
  }
  return (
    <section className="cp-catalog-banner">
      <div className="cp-catalog-body">
        <small className="cp-catalog-eyebrow">Your IISER journey starts here</small>
        <h1>Ace the IAT with a course built for it</h1>
        <p>You are not enrolled in a course yet. Pick one from our catalog and start learning today, with everything you need to crack the IISER Aptitude Test in one place.</p>
        <ul className="cp-catalog-perks">
          {PERKS.map(({ icon: PerkIcon, text }) => (
            <li key={text}><span><PerkIcon width={16} height={16} /></span>{text}</li>
          ))}
        </ul>
        <a className="cp-btn cp-btn-amber" href={CATALOG_URL} target="_blank" rel="noopener noreferrer">
          Explore the catalog <Icon.ChevronRight width={16} height={16} />
        </a>
      </div>
      <div className="cp-catalog-art" aria-hidden="true">
        <span className="cp-catalog-orb"><Icon.Graduation width={54} height={54} /></span>
      </div>
    </section>
  );
}
