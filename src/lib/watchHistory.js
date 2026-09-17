// Watch history for the course pages.
//
// "Recently watched" comes from the backend (user/watch-history.php, read from
// candidate_course_progress), so it follows the candidate across devices. The
// course player also notes what is opened in this browser (localStorage); that
// copy is only used when the API cannot be reached.
import { getWatchHistoryRows } from './candidateApi';

const KEY = 'cp_watch_history';
const MAX_ITEMS = 40;

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
  return (await getWatchHistoryRows(courseIds, size))
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
      // Epoch seconds, shown as "2 days ago"; `lastWatch` is the same moment as text.
      lastWatch: it.lastWatchEpoch ? it.lastWatchEpoch * 1000 : undefined,
      lastWatchLabel: it.lastWatchEpoch ? undefined : it.lastWatch,
    }));
}

// Latest `size` videos watched in the given player courses, newest first.
export async function getWatchHistory(courseIds, size = 3) {
  const wanted = (courseIds || []).map(String);
  if (wanted.length === 0) return [];
  try {
    return (await fromApi(wanted, size)).slice(0, size);
  } catch (err) {
    if (err?.response?.status === 401) throw err;
    /* API unreachable: fall back to this browser's history */
  }
  return readAll()
    .filter((e) => wanted.includes(String(e.course)))
    .sort((a, b) => (b.lastWatch || 0) - (a.lastWatch || 0))
    .slice(0, size);
}
