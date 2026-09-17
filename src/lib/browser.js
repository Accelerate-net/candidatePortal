// Browser-side helpers that the exam flows and third-party embeds need.

// Sent with start-exam / start-quiz so the backend can tie an attempt to a device.
export function browserFingerprint() {
  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    cpuCores: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory || 'unknown',
  };
}

// Load a classic script once (Razorpay checkout, Bunny player.js).
const loaded = new Map();
export function loadScript(src) {
  if (loaded.has(src)) return loaded.get(src);
  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { loaded.delete(src); reject(new Error(`Could not load ${src}`)); };
    document.head.appendChild(script);
  });
  loaded.set(src, promise);
  return promise;
}

// Query-string helpers that keep the URL in sync without a navigation.
export function setSearchParam(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url);
}

export function replaceSearchParam(name, value) {
  const url = new URL(window.location);
  if (value === null || value === undefined) url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  window.history.replaceState({}, '', url);
}

export function getSearchParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Small cookie helpers for UI preferences (not the session; see auth.js).
export function getCookie(name) {
  const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}
