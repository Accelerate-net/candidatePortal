// Small display helpers shared across pages.

// "2 Marks" style numbers from the API arrive multiplied by 100.
export function pct(value) {
  return (Number(value) / 100).toFixed(0);
}

export function pct1(value) {
  return (Number(value) / 100).toFixed(1);
}

// "1m 05s" / "45s" for the time-distribution axis and tooltips.
export function minutes(seconds) {
  const s = Number(seconds) || 0;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${String(r).padStart(2, '0')}s`;
}

// "1 hr 5 min" / "24 min" / "< 1 min" for course parts.
export function duration(value) {
  if (!value || Number.isNaN(Number(value))) return '';
  const seconds = parseInt(value, 10);
  if (seconds < 60) return '< 1 min';
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}${rest > 0 ? ` ${rest} min` : ''}`;
  return `${mins} min`;
}

export function formatAmount(paise) {
  return (Number(paise) / 100).toFixed(2);
}

// "+91 98XXXXXX10": keep the first two and last two digits.
export function maskMobile(countryCode, mobile) {
  if (typeof mobile !== 'string' || mobile.length < 6) return '';
  const digits = mobile.split('');
  for (let i = 2; i < digits.length - 2; i += 1) digits[i] = 'X';
  return `${countryCode} ${digits.join('')}`;
}

export function plural(n, word) {
  return `${n} ${word}${Number(n) === 1 ? '' : 's'}`;
}
