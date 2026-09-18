import React, { useEffect, useRef, useState } from 'react';
import { useUser } from './UserProvider';

// Shared page primitives: cards, pills, avatar, loading/error/empty states.

export function Card({ children, className = '', as: Tag = 'section', ...rest }) {
  return <Tag className={`cp-card ${className}`} {...rest}>{children}</Tag>;
}

export function Pill({ tone = 'ghost', size = '', children, className = '', ...rest }) {
  return (
    <span className={`cp-pill is-${tone} ${size === 'sm' ? 'cp-pill-sm' : ''} ${className}`} {...rest}>
      <span>{children}</span>
    </span>
  );
}

// Default pictures for candidates who have not added a photo: by the profile's
// gender, with the previous neutral icon when the gender is not set.
export const DEFAULT_PHOTO = 'https://img.icons8.com/color/100/user.png';
const DEFAULT_BY_GENDER = { female: '/default-user/default-female.png', male: '/default-user/default-male.png' };

export function defaultPhoto(gender) {
  return DEFAULT_BY_GENDER[String(gender || '').trim().toLowerCase()] || DEFAULT_PHOTO;
}

// Empty, or the old neutral placeholder saved as the photo, both mean "no photo".
const hasOwnPhoto = (src) => Boolean(src) && src !== DEFAULT_PHOTO;

// Profile photos arrive as base64 data URLs. Each <img> given the raw data URL
// decodes it again, so the data is turned into a blob once and every avatar on
// every screen points at the same blob URL, which the browser keeps decoded.
const blobUrls = new Map(); // data URL -> blob: URL
function photoUrl(src) {
  if (!src || !src.startsWith('data:')) return src;
  let url = blobUrls.get(src);
  if (!url) {
    try {
      const [head, data] = src.split(',', 2);
      const type = head.slice(5).split(';')[0] || 'image/jpeg';
      const bytes = head.includes(';base64') ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(data));
      url = URL.createObjectURL(new Blob([bytes], { type }));
    } catch { url = src; }
    blobUrls.set(src, url);
  }
  return url;
}

/**
 * Profile picture with a shimmer placeholder. The shimmer shows while the
 * profile is still being fetched (`pending`) and until the image itself has
 * loaded, so the shell never flashes an empty circle. Without a photo (or when
 * it fails to load) the default for `gender` shows; `gender` falls back to the
 * signed-in candidate's profile.
 */
export function Avatar({ src, gender, size = 'sm', className = '', alt = '', pending = false, radius }) {
  const { profile } = useUser() || {};
  const fallback = defaultPhoto(gender ?? profile?.gender);
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [src]);
  const url = hasOwnPhoto(src) && !broken ? photoUrl(src) : fallback;
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    // A cached image can finish before React attaches onLoad.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, [url]);

  const showShimmer = pending || !loaded;
  return (
    <span className={`cp-avatar-wrap is-${size} ${className}`} style={radius ? { borderRadius: radius } : undefined}>
      {!pending && (
        <img
          ref={imgRef}
          className="cp-avatar"
          src={url}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => { if (url !== fallback) setBroken(true); else setLoaded(true); }}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
      {showShimmer && <span className="cp-avatar-shimmer" aria-hidden="true" />}
    </span>
  );
}

export function PageState({ loading, error, empty, action }) {
  if (loading) {
    return (
      <div className="cp-page" aria-busy="true">
        <div className="cp-grid cp-grid-2">
          <div className="cp-card cp-skeleton" />
          <div className="cp-card cp-skeleton" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="cp-page">
        <div className="cp-card cp-state">
          <strong>Couldn't load this page</strong>
          <p>{error}</p>
          <button type="button" className="cp-btn cp-btn-primary" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="cp-page">
        <div className="cp-card cp-state">
          <p>{empty}</p>
          {action}
        </div>
      </div>
    );
  }
  return null;
}

export function KpiCard({ title, icon, value, sub, ...rest }) {
  return (
    <Card {...rest}>
      <div className="cp-kpi-head">
        <h2>{title}</h2>
        {icon && <span className="cp-kpi-icon">{icon}</span>}
      </div>
      <div className="cp-kpi-value"><strong>{value}</strong></div>
      {sub && <p className="cp-kpi-sub">{sub}</p>}
    </Card>
  );
}
