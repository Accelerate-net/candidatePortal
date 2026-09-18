import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { getExamStats } from '../lib/candidateApi';

// Marks can carry decimals (94.8); show one decimal at most, whole numbers as they are.
const marks = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '–';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};
const diff = (a, b) => marks(Math.abs(a - b));
const num = (value) => (Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value) : null);

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
 * { maxScore, myScore, myRank, classStrength, topScore, classAverage,
 *   subjects: [{ name, myScore, classAverage, topScore, maxScore }] }
 * Older responses send { avgTotal, attemptedCount, avgSectionWise: [{ section, label, score }] }
 * instead; both are rendered. Without `myScore` the summary row's score stands in.
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

  const maxScore = num(stats?.maxScore) || 0;
  const topScore = num(stats?.topScore);
  const classAverage = num(stats?.classAverage) ?? num(stats?.avgTotal);
  const myRank = num(stats?.myRank);
  const classStrength = num(stats?.classStrength) ?? num(stats?.attemptedCount);

  const mine = myScoreOf(report);
  const myScore = num(stats?.myScore) ?? mine?.score ?? null;
  const myMax = num(stats?.myScore) != null ? maxScore : (mine?.max || maxScore);

  // Per-subject "you vs class" bars; older responses only carry class averages per section.
  const subjects = Array.isArray(stats?.subjects)
    ? stats.subjects.filter((s) => s && (num(s.myScore) != null || num(s.classAverage) != null))
    : [];
  const sections = !subjects.length && Array.isArray(stats?.avgSectionWise)
    ? stats.avgSectionWise.filter((s) => s && num(s.score) != null)
    : [];
  const sectionMax = sections.reduce((m, s) => Math.max(m, Number(s.score)), 0);

  let myScoreNote = 'in this exam';
  if (myScore != null && classAverage != null) {
    myScoreNote = myScore === classAverage
      ? 'same as the class average'
      : `${diff(myScore, classAverage)} ${myScore > classAverage ? 'above' : 'below'} the class average`;
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
              {myRank != null ? (
                <div className="cp-pay-tile is-dark">
                  <small>My rank</small>
                  <strong>{myRank}{classStrength != null && <span> / {classStrength}</span>}</strong>
                  <em>in this exam</em>
                </div>
              ) : (
                <div className="cp-pay-tile is-dark">
                  <small>Attempted</small>
                  <strong>{classStrength ?? '–'}</strong>
                  <em>student{classStrength === 1 ? '' : 's'} took this exam</em>
                </div>
              )}
              <div className="cp-pay-tile is-lime">
                <small>Top score</small>
                <strong>{marks(topScore)}<span> / {marks(maxScore)}</span></strong>
                <em>highest in class</em>
              </div>
              {myScore != null && (
                <div className="cp-pay-tile">
                  <small>My score</small>
                  <strong>{marks(myScore)}<span> / {marks(myMax)}</span></strong>
                  <em>{myScoreNote}</em>
                </div>
              )}
              <div className="cp-pay-tile is-sky">
                <small>Class average</small>
                <strong>{marks(classAverage)}<span> / {marks(maxScore)}</span></strong>
                <em>{classStrength != null ? `${classStrength} student${classStrength === 1 ? '' : 's'}` : (maxScore > 0 && classAverage != null ? `${Math.round((classAverage / maxScore) * 100)}% of the total` : 'total marks')}</em>
              </div>
            </div>

            {subjects.length > 0 && (
              <>
                <h3 className="cp-stats-sub">Subject-wise: you vs class average</h3>
                <ul className="cp-stats-subjects">
                  {subjects.map((s, i) => {
                    const name = s.name || `Subject ${i + 1}`;
                    const max = num(s.maxScore) || 0;
                    const me = num(s.myScore);
                    const avg = num(s.classAverage);
                    const top = num(s.topScore);
                    return (
                      <li key={`${name}-${i}`}>
                        <div className="cp-stats-row">
                          <strong>{name}</strong>
                          <small>out of {marks(max)}{top != null ? ` · top ${marks(top)}` : ''}</small>
                        </div>
                        <div className="cp-duo-bar">
                          {me != null && (
                            <div className="cp-duo-line is-me" aria-label={`You: ${marks(me)} out of ${marks(max)}`}>
                              <div className="cp-duo-track"><div className="cp-duo-fill is-me" style={{ width: `${pctOf(me, max)}%` }} /></div>
                              <b>{marks(me)}</b>
                            </div>
                          )}
                          {avg != null && (
                            <div className="cp-duo-line is-class" aria-label={`Class average: ${marks(avg)} out of ${marks(max)}`}>
                              <div className="cp-duo-track"><div className="cp-duo-fill is-class" style={{ width: `${pctOf(avg, max)}%` }} /></div>
                              <b>{marks(avg)}</b>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="cp-legend">
                  <span><i className="is-me" />You</span>
                  <span><i className="is-class" />Class average</span>
                </div>
              </>
            )}

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
                          <div className="cp-duo-line is-class" aria-label={`${label}: class average ${marks(score)} marks`}>
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
