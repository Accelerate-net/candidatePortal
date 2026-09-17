// Sample "Recently watched" rows, used until the watch-history API is wired in
// (VITE_WATCH_HISTORY_URL) and nothing has been watched in this browser yet.
// Built from the open course's own chapters so the cards open real videos.
const SAMPLES = [
  { title: 'Introduction and key ideas', duration: 1440, progress: 610, minutesAgo: 35 },
  { title: 'Worked examples', duration: 1080, progress: 1080, minutesAgo: 60 * 26 },
  { title: 'Previous year questions', duration: 1980, progress: 240, minutesAgo: 60 * 24 * 4 },
];

export function demoWatchHistory(chapters = [], modules = {}) {
  const playable = chapters.filter((c) => c.url && c.url !== '#');
  // Playable chapters first, then the rest, so there are always up to three cards.
  const picks = [...playable, ...chapters.filter((c) => !playable.includes(c))].slice(0, SAMPLES.length);
  return picks.map((ch, i) => {
    let ids = {};
    try {
      const q = new URL(ch.url, window.location.origin).searchParams;
      ids = { course: q.get('course'), module: q.get('module'), chapter: q.get('chapter'), part: q.get('view') };
    } catch { /* no player link */ }
    const s = SAMPLES[i];
    return {
      sample: true,
      course: ids.course ?? 'demo', module: ids.module ?? ch.moduleId, chapter: ids.chapter ?? ch.chapterNumber, part: ids.part ?? i,
      href: ch.url && ch.url !== '#' ? ch.url : null,
      title: `${ch.title}: ${s.title}`,
      chapterTitle: `Chapter ${ch.chapterNumber}`,
      moduleName: modules[ch.moduleId]?.name || '',
      duration: s.duration, progress: s.progress,
      lastWatch: Date.now() - s.minutesAgo * 60000,
    };
  });
}
