import React, { useEffect, useRef, useState } from 'react';
import { isAuthenticated } from '../lib/auth';
import { getCourseProgress, saveCourseProgress } from '../lib/candidateApi';
import { recordWatch } from '../lib/watchHistory';
import { loadScript } from '../lib/browser';
import { duration } from '../lib/format';
import { useToast } from '../components/Toast';
import '../styles/pages/course-player.css';

const PLAYER_JS = '/vendor/player.min.js';

function progressPercent(progress, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((progress / total) * 100)));
}

// "CH01" → "Chapter 1"; any other code is shown as is.
function chapterLabel(code) {
  const m = /^CH0*(\d+)$/i.exec(code || '');
  return m ? `Chapter ${m[1]}` : code;
}

function ProgressRing({ percent, index }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="chapter-number-wrapper">
      <svg className="progress-ring" width="40" height="40">
        <circle className="progress-ring__circle-bg" cx="20" cy="20" r={r} />
        <circle className="progress-ring__circle" cx="20" cy="20" r={r} style={{ strokeDasharray: circumference, strokeDashoffset: circumference - (percent / 100) * circumference }} />
      </svg>
      <span className="chapter-number">{percent > 98 ? <p>✓</p> : index}</span>
    </div>
  );
}

/**
 * Course video player: chapter parts in the sidebar (with watch progress
 * rings), the selected part streamed from Bunny in an iframe, and progress
 * saved every 11 seconds and at the end through player.js.
 */
export default function CoursePage() {
  const toast = useToast();
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('course');
  const moduleId = params.get('module');
  const chapterId = params.get('chapter');
  const viewParam = params.get('view');
  const selectedPartId = viewParam && Number(viewParam) >= 0 ? viewParam : '0';

  const [unauthorised] = useState(!isAuthenticated());
  const [data, setData] = useState(null); // { module, chapter, part }
  const [progress, setProgress] = useState({}); // partId -> percent
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const seekedRef = useRef(false);
  const claimedRef = useRef(-1);

  useEffect(() => { document.title = 'Crispr Learning'; }, []);

  useEffect(() => {
    if (unauthorised) return;
    getCourseProgress({ courseId, moduleId, chapterId, partId: selectedPartId })
      .then((res) => {
        if (res.status !== 'success') { toast(res.message); return; }
        const module = res.data.modules.find((m) => m.id === moduleId);
        const chapter = module?.chapters.find((c) => c.id === chapterId);
        const part = chapter?.parts.find((p) => p.id === selectedPartId);
        if (!module || !chapter || !part) return;
        const initial = {};
        chapter.parts.forEach((p) => { initial[p.id] = progressPercent(p.progress, p.duration); });
        setProgress(initial);
        setData({ module, chapter, part });
        // Feeds "Recently watched" on the courses page.
        recordWatch({
          course: courseId, module: moduleId, chapter: chapterId, part: selectedPartId,
          title: part.title, chapterTitle: chapter.title, moduleName: module.name,
          duration: Number(part.duration) || 0, progress: Number(part.progress) || 0,
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unauthorised]);

  // Teacher popup closes on Escape.
  useEffect(() => {
    if (!teacherOpen) return undefined;
    function onKey(e) { if (e.key === 'Escape') setTeacherOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [teacherOpen]);

  // Attach player.js to the Bunny iframe once it loads.
  useEffect(() => {
    if (!data) return undefined;
    const iframe = iframeRef.current;
    if (!iframe) return undefined;
    let cancelled = false;
    const userProgress = parseInt(data.part.progress, 10) || 0;

    async function attach() {
      await loadScript(PLAYER_JS);
      if (cancelled || !window.playerjs) return;
      const player = new window.playerjs.Player(iframe);
      playerRef.current = player;
      let lastSavedSecond = -1;

      player.on('ready', () => {
        if (userProgress > 10 && !seekedRef.current) {
          seekedRef.current = true;
          player.setCurrentTime(userProgress);
        }
      });

      player.on('timeupdate', (timing) => {
        const currentTime = timing.seconds;
        const percent = Math.floor((currentTime / timing.duration) * 100);
        const currentRounded = Math.floor(currentTime);
        const totalRounded = Math.floor(timing.duration);
        if (currentRounded !== lastSavedSecond && (currentRounded === totalRounded || currentRounded % 11 === 0)) {
          lastSavedSecond = currentRounded;
          save(currentRounded, totalRounded, percent);
        }
      });
    }

    function save(progressInSeconds, totalDurationRounded, percent) {
      if (claimedRef.current === progressInSeconds) return;
      claimedRef.current = progressInSeconds;
      saveCourseProgress({ courseId, moduleId, chapterId, partId: selectedPartId, progressInSeconds, duration: totalDurationRounded })
        .then((res) => {
          if (res.status === 'success') {
            setProgress((p) => ({ ...p, [selectedPartId]: percent }));
            recordWatch({ course: courseId, module: moduleId, chapter: chapterId, part: selectedPartId, duration: totalDurationRounded, progress: progressInSeconds });
          }
          else console.warn('Unable to save course progress.');
        })
        .catch(() => console.warn('Unable to save course progress.'));
    }

    iframe.onload = attach;
    return () => { cancelled = true; playerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function openContent(partId) {
    const url = new URL(window.location);
    url.searchParams.set('view', partId);
    url.searchParams.set('t', String(Date.now()));
    window.location.href = url.toString();
  }

  if (unauthorised) {
    return (
      <div className="cp-course">
        <div className="error-overlay">
          <div className="error-content">
            <h2>Sorry, something is not right here.</h2>
            <a href="/start">Go Back to Candidate Portal</a>
          </div>
        </div>
      </div>
    );
  }

  const { module, chapter, part } = data || {};
  const embedSrc = part ? `https://iframe.mediadelivery.net/embed/${part.directory}/${part.source}?autoplay=true` : '';

  return (
    <div className="cp-course">
      <button type="button" className="toggle-sidebar" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle chapter list">{sidebarOpen ? 'X' : '☰'}</button>
      <a className="course-brand" href="/courses"><img src="/logo/crispr-logo.svg" alt="Crispr Learning" /></a>

      <div className="container">
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          {module && <h3>{module.name}: {chapterLabel(chapter.code)}</h3>}
          {chapter && <h2>{chapter.title}</h2>}
          <ul className="chapter-list">
            {(chapter?.parts || []).map((p, i) => (
              <li key={p.id} className={`chapter ${p.id === selectedPartId ? 'active' : ''}`} onClick={() => openContent(p.id)}>
                <div>
                  <ProgressRing percent={progress[p.id] || 0} index={i + 1} />
                  <div className="chapter-details"><strong>{p.title}</strong></div>
                  <p className="chapter-duration">{duration(p.duration)}</p>
                </div>
              </li>
            ))}
          </ul>
          {chapter?.teacher && (
            <div className="mentor-block">
              <p className="mentor-heading">Know your Instructor</p>
              <button type="button" className="mentor" onClick={() => setTeacherOpen(true)} aria-haspopup="dialog">
                <img src={chapter.teacher.photo} alt="" />
                <strong>{chapter.teacher.name}</strong>
              </button>
            </div>
          )}
        </div>

        <div className="content">
          <h3>{part?.title}</h3>
          <p className="subtext">
            {chapter && <>{chapter.code} - {chapter.title} from <b>{module.name}</b> · {duration(part.duration)}</>}
          </p>
          <div className="video-wrapper">
            {embedSrc && (
              <iframe
                ref={iframeRef}
                title={part.title}
                src={embedSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>

      {teacherOpen && chapter?.teacher && (
        <div className="mentor-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setTeacherOpen(false); }}>
          <div className="mentor-popup" role="dialog" aria-modal="true" aria-labelledby="mentor-popup-name">
            <button type="button" className="mentor-popup-close" onClick={() => setTeacherOpen(false)} aria-label="Close">✕</button>
            <img src={chapter.teacher.photo} alt="" />
            <strong id="mentor-popup-name">{chapter.teacher.name}</strong>
            {chapter.teacher.brief && <p>{chapter.teacher.brief}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
