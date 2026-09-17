// Watch history for the course pages.
//
// The course player records what is opened and how far it was watched in this
// browser (localStorage). When VITE_WATCH_HISTORY_URL points at the
// watch-history API (GET {url}/course/{courseId}?size=N, Bearer token), that is
// used instead, so the history follows the candidate across devices.
import axios from 'axios';
import { getToken } from './auth';

const KEY = 'cp_watch_history';
const MAX_ITEMS = 40;
const API_URL = (import.meta.env.VITE_WATCH_HISTORY_URL || '').replace(/\/$/, '');

const idOf = (e) => `${e.course}-${e.module}-${e.chapter}-${e.part}`;

function readAll() {
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

// entry: { course, module, chapter, part, title, chapterTitle, moduleName, duration, progress, thumbnail }
export function recordWatch(entry) {
  if (!entry || entry.course == null || entry.part == null) return;
  try {
    const id = idOf(entry);
    const previous = readAll().find((e) => idOf(e) === id) || {};
    const next = { ...previous, ...entry, lastWatch: Date.now() };
    const list = [next, ...readAll().filter((e) => idOf(e) !== id)].slice(0, MAX_ITEMS);
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage unavailable: history is simply not kept */ }
}

export function playerUrl(e) {
  const q = new URLSearchParams({ course: e.course, module: e.module, chapter: e.chapter, view: e.part });
  return `/course?${q.toString()}`;
}

// Numeric player course ids behind a bundle, read from its chapter links
// (…/course?course=70000&module=1&chapter=3&view=1).
export function playerCourseIds(chapters = []) {
  const ids = new Set();
  chapters.forEach((c) => {
    try {
      const id = new URL(c.url, window.location.origin).searchParams.get('course');
      if (id) ids.add(String(id));
    } catch { /* not a player link */ }
  });
  return [...ids];
}

async function fromApi(courseIds, size) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  const pages = await Promise.all(courseIds.map((id) => axios.get(`${API_URL}/course/${encodeURIComponent(id)}`, { params: { size: size * 3 }, headers, timeout: 15000 })));
  return pages
    .flatMap((res) => (Array.isArray(res.data) ? res.data : res.data?.data || []))
    .filter((it) => !it.type || it.type === 'VIDEO')
    .map((it) => ({
      course: it.contentMetadata?.course,
      module: it.contentMetadata?.module,
      chapter: it.contentMetadata?.chapter,
      part: it.contentMetadata?.part,
      title: it.title,
      duration: it.duration,
      progress: it.progress,
      thumbnail: it.thumbnail || '',
      lastWatchLabel: it.lastWatch,
    }));
}

// Latest `size` videos watched in the given player courses, newest first.
export async function getWatchHistory(courseIds, size = 3) {
  const wanted = (courseIds || []).map(String);
  if (wanted.length === 0) return [];
  if (API_URL) {
    try { return (await fromApi(wanted, size)).slice(0, size); } catch { /* fall back to this browser's history */ }
  }
  return readAll()
    .filter((e) => wanted.includes(String(e.course)))
    .sort((a, b) => (b.lastWatch || 0) - (a.lastWatch || 0))
    .slice(0, size);
}
