import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { Pill } from './ui';
import { getExamStats } from '../lib/candidateApi';

const pctOf = (value, max) => (max ? Math.max(2, Math.min(100, Math.round((value / max) * 100))) : 0);

/**
 * Class statistics for one weekly-exam attempt: top score, my rank, class
 * average, and my score against the class average per subject.
 */
export default function ExamStatsDialog({ report, onClose }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!report) return undefined;
    let alive = true;
    setStats(null); setError('');
    getExamStats(report)
      .then((data) => { if (alive) setStats(data); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load the class statistics.'); });
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { alive = false; document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [report, onClose]);

  if (!report) return null;

  return (
    <div className="cp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="cp-modal cp-stats-modal" role="dialog" aria-modal="true" aria-labelledby="cp-stats-title">
        <div className="cp-stats-head">
          <div>
            <h2 id="cp-stats-title">Class stats</h2>
            <p>{report.title}{report.dateOfExam ? ` · ${report.dateOfExam}` : ''}</p>
          </div>
          <button type="button" className="cp-icon-btn" onClick={onClose} aria-label="Close"><Icon.X width={18} height={18} /></button>
        </div>

        {error && <div className="cp-alert cp-alert-error" role="alert">{error}</div>}
        {!stats && !error && <div className="cp-skeleton" style={{ minHeight: 220 }} aria-busy="true" />}

        {stats && (
          <>
            {stats.sample && <Pill tone="sky" size="sm" className="cp-sample-pill">Sample data</Pill>}

            <div className="cp-stats-tiles">
              <div className="cp-pay-tile is-dark">
                <small>My rank</small>
                <strong>{stats.myRank}<span> / {stats.classStrength}</span></strong>
                <em>in this exam</em>
              </div>
              <div className="cp-pay-tile is-lime">
                <small>Top score</small>
                <strong>{stats.topScore}<span> / {stats.maxScore}</span></strong>
                <em>highest in class</em>
              </div>
              <div className="cp-pay-tile">
                <small>My score</small>
                <strong>{stats.myScore}<span> / {stats.maxScore}</span></strong>
                <em>{stats.myScore >= stats.classAverage ? `${stats.myScore - stats.classAverage} above average` : `${stats.classAverage - stats.myScore} below average`}</em>
              </div>
              <div className="cp-pay-tile is-sky">
                <small>Class avg. total</small>
                <strong>{stats.classAverage}<span> / {stats.maxScore}</span></strong>
                <em>{stats.classStrength} students</em>
              </div>
            </div>

            <h3 className="cp-stats-sub">Subject-wise: you vs class average</h3>
            <ul className="cp-stats-subjects">
              {stats.subjects.map((s) => (
                <li key={s.name}>
                  <div className="cp-stats-row">
                    <strong>{s.name}</strong>
                    <small>out of {s.maxScore}</small>
                  </div>
                  <div className="cp-duo-bar">
                    <div className="cp-duo-line" aria-label={`You: ${s.myScore} out of ${s.maxScore}`}>
                      <div className="cp-duo-track"><div className="cp-duo-fill is-me" style={{ width: `${pctOf(s.myScore, s.maxScore)}%` }} /></div>
                      <b>{s.myScore}</b>
                    </div>
                    <div className="cp-duo-line" aria-label={`Class average: ${s.classAverage} out of ${s.maxScore}`}>
                      <div className="cp-duo-track"><div className="cp-duo-fill is-class" style={{ width: `${pctOf(s.classAverage, s.maxScore)}%` }} /></div>
                      <b>{s.classAverage}</b>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cp-legend">
              <span><i className="is-me" />You</span>
              <span><i className="is-class" />Class average</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
