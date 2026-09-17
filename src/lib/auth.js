// Candidate session token. It lives in the `crispriteUserToken` cookie exactly
// as the previous AngularJS pages stored it (7-day expiry, path=/), so an
// existing login keeps working after the move to React.
const TOKEN_COOKIE = 'crispriteUserToken';

function readCookie(name) {
  const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getToken() {
  return readCookie(TOKEN_COOKIE) || '';
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function setToken(token) {
  if (!token) return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/`;
}

export function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}
