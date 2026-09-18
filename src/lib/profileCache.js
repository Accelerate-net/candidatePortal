// The signed-in candidate's profile, kept for the session so that every
// screen can show the name and photo at once instead of fetching them again.
//
// The profile photo is a base64 data URL inside the profile JSON, so a fetch
// per screen was re-downloading the picture each time. The cache is keyed by
// the session token: a different login never sees another candidate's data,
// and signing out clears it.
import { getProfile } from './candidateApi';
import { getToken } from './auth';

const KEY = 'cp_profile';
let memory = null; // { token, profile }

function fromStorage() {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const entry = raw ? JSON.parse(raw) : null;
    return entry && entry.token && entry.profile ? entry : null;
  } catch { return null; }
}

export function readCachedProfile() {
  const token = getToken();
  if (!token) return null;
  if (!memory) memory = fromStorage();
  return memory && memory.token === token ? memory.profile : null;
}

export function writeCachedProfile(profile) {
  const token = getToken();
  if (!token || !profile) return;
  memory = { token, profile };
  try { window.sessionStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* quota or private mode: memory copy still works */ }
}

export function clearCachedProfile() {
  memory = null;
  try { window.sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

// Cached profile when there is one, else fetched (and then cached).
export async function getProfileCached() {
  const cached = readCachedProfile();
  if (cached) return cached;
  const profile = await getProfile();
  writeCachedProfile(profile);
  return profile;
}
