import React, { useState } from 'react';
import { Icon } from './Icons';
import { playerUrl } from '../lib/watchHistory';

const POSTERS = ['is-teal', 'is-amber', 'is-rose', 'is-indigo'];

function clock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

function ago(timestamp) {
  if (!timestamp) return '';
  const mins = Math.round((Date.now() - timestamp) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * "Recently watched" strip: video cards with a 16:9 poster, duration badge and
 * a watched-progress bar. The poster is the video thumbnail when the history
 * carries one, else a generated cover.
 * items: [{ course, module, chapter, part, title, chapterTitle, moduleName, duration, progress, thumbnail, lastWatch, lastWatchLabel }]
 */
// One card. The Bunny poster is swapped for the generated cover when it fails
// to load (expired token, CDN 403), instead of leaving an empty frame.
function WatchCard({ it, moduleName }) {
  const [broken, setBroken] = useState(false);
  const duration = Number(it.duration) || 0;
  const watched = duration ? Math.min(100, Math.round(((Number(it.progress) || 0) / duration) * 100)) : 0;
  const when = it.lastWatchLabel || ago(it.lastWatch);
  const poster = Boolean(it.thumbnail) && !broken;
  return (
    <a className="cp-watch-card" href={it.href || playerUrl(it)} target="_blank" rel="noopener noreferrer">
      <span className={`cp-watch-thumb ${poster ? '' : POSTERS[(Number(it.module) || 0) % POSTERS.length]}`}>
        {poster
          ? <img src={it.thumbnail} alt="" loading="lazy" onError={() => setBroken(true)} />
          : <span className="cp-watch-poster" aria-hidden="true">{moduleName || 'Crispr'}</span>}
        <span className="cp-watch-play"><Icon.Play width={20} height={20} /></span>
        {watched >= 95 && <span className="cp-watch-done">Watched</span>}
        {duration > 0 && <span className="cp-watch-duration">{clock(duration)}</span>}
        {watched > 0 && <span className="cp-watch-progress"><i style={{ width: `${watched}%` }} /></span>}
      </span>
      <strong className="cp-watch-name">{it.title || it.chapterTitle || 'Video'}</strong>
      <small className="cp-watch-meta">{[when, it.title && it.chapterTitle, poster && moduleName].filter(Boolean).join(' · ')}</small>
    </a>
  );
}

export default function WatchHistory({ items, moduleNames = {} }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="cp-watch" aria-label="Recently watched">
      <h3 className="cp-watch-title">
        <Icon.PlayCircle width={16} height={16} /> Recently watched
      </h3>
      <div className="cp-watch-row">
        {items.map((it) => (
          <WatchCard key={`${it.course}-${it.module}-${it.chapter}-${it.part}`} it={it} moduleName={it.moduleName || moduleNames[it.module] || ''} />
        ))}
      </div>
    </section>
  );
}
