import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { getExamStats } from '../lib/candidateApi';

// Marks can carry decimals (100.69); show one decimal at most, whole numbers as they are.
const marks = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '–';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};
const diff = (a, b) => marks(Math.abs(a - b));

const pctOf = (value, max) => (max > 0 ? Math.max(2, Math.min(100, Math.round((value / max) * 100))) : 0);

// quiz-summary.php rows carry the candidate's score as "92 / 120" (or a number).
function myScoreOf(report) {
  const raw = report?.score;
  if (typeof raw === 'number') return { score: raw, max: null };
  const nums = String(raw ?? '').match(/-?\d+(?:\.\d+)?/g) || [];
  if (!nums.length) return null;
  return { score: Number(nums[0]), max: nums.length > 1 ? Number(nums[1]) : null };
}

/**
 * Class statistics for one quiz (user/quiz/quiz-stats.php):
 * { topScore, maxScore, avgTotal, attemptedCount, avgSectionWise: [{ section, label, score }] }
 * "My score" comes from the summary row the popup was opened from.
 */
export default function ExamStatsDialog({ report, onClose }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!report) return undefined;
    let alive = true;
    setStats(null); setError('');
    getExamStats(report)
      .then((data) => { if (alive) setStats(data && typeof data === 'object' ? data : {}); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load the class statistics.'); });
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { alive = false; document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [report, onClose]);

  if (!report) return null;

  const maxScore = Number(stats?.maxScore) || 0;
  const topScore = Number(stats?.topScore);
  const avgTotal = Number(stats?.avgTotal);
  const attempted = Number(stats?.attemptedCount);
  const mine = myScoreOf(report);
  const myScore = mine?.score ?? null;
  const myMax = mine?.max || maxScore;
  const sections = Array.isArray(stats?.avgSectionWise)
    ? stats.avgSectionWise.filter((s) => s && Number.isFinite(Number(s.score)))
    : [];
  const sectionMax = sections.reduce((m, s) => Math.max(m, Number(s.score)), 0);

  let myScoreNote = '';
  if (myScore != null && Number.isFinite(avgTotal)) {
    if (myScore === avgTotal) myScoreNote = 'same as the class average';
    else myScoreNote = `${diff(myScore, avgTotal)} ${myScore > avgTotal ? 'above' : 'below'} the class average`;
  }

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
            <div className="cp-stats-tiles">
              <div className="cp-pay-tile is-lime">
                <small>Top score</small>
                <strong>{marks(topScore)}<span> / {marks(maxScore)}</span></strong>
                <em>highest in class</em>
              </div>
              <div className="cp-pay-tile is-sky">
                <small>Class average</small>
                <strong>{marks(avgTotal)}<span> / {marks(maxScore)}</span></strong>
                <em>{maxScore > 0 && Number.isFinite(avgTotal) ? `${Math.round((avgTotal / maxScore) * 100)}% of the total` : 'total marks'}</em>
              </div>
              {myScore != null && (
                <div className="cp-pay-tile">
                  <small>My score</small>
                  <strong>{marks(myScore)}<span> / {marks(myMax)}</span></strong>
                  <em>{myScoreNote || 'in this exam'}</em>
                </div>
              )}
              <div className="cp-pay-tile is-dark">
                <small>Attempted</small>
                <strong>{Number.isFinite(attempted) ? attempted : '–'}</strong>
                <em>student{attempted === 1 ? '' : 's'} took this exam</em>
              </div>
            </div>

            {sections.length > 0 && (
              <>
                <h3 className="cp-stats-sub">Section-wise class average</h3>
                <ul className="cp-stats-subjects">
                  {sections.map((s, i) => {
                    const score = Number(s.score);
                    const label = s.label || `Section ${s.section ?? i + 1}`;
                    return (
                      <li key={`${s.section ?? label}-${i}`}>
                        <div className="cp-stats-row">
                          <strong>{label}</strong>
                          <small>avg. marks</small>
                        </div>
                        <div className="cp-duo-bar">
                          <div className="cp-duo-line" aria-label={`${label}: class average ${marks(score)} marks`}>
                            <div className="cp-duo-track"><div className="cp-duo-fill is-class" style={{ width: `${pctOf(score, sectionMax)}%` }} /></div>
                            <b>{marks(score)}</b>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="cp-legend">
                  <span><i className="is-class" />Class average per section</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
