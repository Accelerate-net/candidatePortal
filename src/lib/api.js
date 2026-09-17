import axios from 'axios';
import { clearToken, getToken } from './auth';

// The candidate APIs are the PHP scripts under CrisprTechApp/crispr-apis
// (user/*.php, user/quiz/*.php, user/checkout/*.php, public/*.php).
// VITE_API_BASE overrides the origin + prefix; production is the default so
// the deployed portal behaves exactly like the previous pages did.
const ENV_API_BASE = import.meta.env?.VITE_API_BASE;

export const BASE_URL = (ENV_API_BASE ? String(ENV_API_BASE) : 'https://crisprtech.app/crispr-apis').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const START_PATH = '/start';

// The session is gone (no token, or the API answered 401): drop it and send
// the candidate to the start page, remembering where they were so login can
// bring them back. The checkout page has its own sign-in, so it only loses
// the token and stays put.
export function handleUnauthorized() {
  clearToken();
  const { pathname, search } = window.location;
  if (pathname === START_PATH || pathname === '/checkout' || pathname.startsWith('/secure-checkout/')) return;
  window.location.replace(`${START_PATH}?next=${encodeURIComponent(pathname + search)}`);
}

// Where to go after login: a safe in-app `next` if one was given, else null.
export function nextPathFromSearch(search = window.location.search) {
  const next = new URLSearchParams(search).get('next');
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith(START_PATH)) return next;
  return null;
}

const isAuthCall = (url = '') => url.includes('/user/authenticate.php') || url.includes('/user/login.php');

// A few scripts answer with text/plain; parse it so callers always get JSON.
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string') {
      try { response.data = JSON.parse(response.data); } catch { /* leave as-is */ }
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401 && !isAuthCall(error?.config?.url)) handleUnauthorized();
    return Promise.reject(error);
  },
);

// Absolute URL for image / iframe sources rendered straight from the API.
export function apiUrl(path) {
  return `${BASE_URL}/${String(path).replace(/^\/+/, '')}`;
}
