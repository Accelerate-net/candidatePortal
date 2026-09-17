import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Icon } from '../components/Icons';
import { Avatar, Card, KpiCard, Pill } from '../components/ui';
import { useToast } from '../components/Toast';
import { useUser } from '../components/UserProvider';
import ExamStatsDialog from '../components/ExamStatsDialog';
import { pct, pct1, plural } from '../lib/format';
import {
  getDashboardSummary, getProgressReports, getWeeklyExamSummary,
} from '../lib/candidateApi';

// "7 Sept, 2026"
function reportDate(iso) {
  if (!iso) return '—'; // the progress cards table carries no issue date
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '';
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${d.getDate()} ${month}, ${d.getFullYear()}`;
}

export default function PerformancePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useUser() || {};

  const [summary, setSummary] = useState({ name: '', aspiration: '' });
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [progressReports, setProgressReports] = useState(null); // null = loading
  const [statsFor, setStatsFor] = useState(null); // weekly-exam row whose class stats are open

  useEffect(() => {
    getDashboardSummary().then(setSummary).catch(() => {});
    getWeeklyExamSummary().then((data) => setWeeklyReports(Array.isArray(data) ? data : [])).catch(() => setWeeklyReports([]));
    getProgressReports().then(setProgressReports).catch(() => setProgressReports([]));
  }, []);

  // Old "attempt" links land here; the mock-test tiles now live on /test-series.
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'ATTEMPT') {
    return <Navigate to={`/test-series${window.location.search}`} replace />;
  }

  const ds = summary.dashboardSummary || {};
  const displayName = profile?.name || summary.name;
  const me = { name: displayName, photo: summary.photo || profile?.photo, aspiration: summary.aspiration || profile?.aspiration };

  return (
    <Layout title="My Performance" hideTitle user={me}>
      <ExamStatsDialog report={statsFor} onClose={() => setStatsFor(null)} />
      <div className="cp-page">
        {/* WELCOME + SUMMARY TILES */}
        <div className="cp-grid cp-grid-dash-top">
          <Card className="is-dark">
            <div className="cp-welcome">
              <Avatar className="cp-welcome-avatar" src={summary.photo} size="lg" pending={!summary.name} />
              <div className="cp-welcome-text">
                <h2>Welcome {displayName}!</h2>
                {summary.aspiration && <Pill tone="sky">{summary.aspiration}</Pill>}
              </div>
            </div>
          </Card>

          <div className="cp-kpi-grid">
            <KpiCard
              title="Strike Rate"
              icon={<Icon.Flash width={16} height={16} />}
              value={ds.strikeRateFrom > 0 ? `${pct1(ds.strikeRate)}%` : 'NA'}
              sub={ds.strikeRateFrom > 0 ? <>from <b>{ds.strikeRateFrom}</b> attempted tests</> : 'no tests attempted'}
            />
            <KpiCard
              title="Avg Score"
              icon={<Icon.BarChart width={16} height={16} />}
              value={ds.averageScoreFrom > 0 ? <>{pct(ds.averageScore)} <small>/ {ds.averageScoreBase}</small></> : 'NA'}
              sub={ds.averageScoreFrom > 0 ? <>from <b>{ds.averageScoreFrom}</b> attempted tests</> : 'no tests attempted'}
            />
            <KpiCard
              title="PYQs Solved"
              icon={<Icon.Check width={16} height={16} />}
              value={ds.pyqSolved ?? ''}
              sub={ds.pyqSolvedFrom > 0 ? <>from <b>{ds.pyqSolvedFrom}</b> questions</> : 'no PYQs available'}
            />
            <KpiCard
              title="Strong Subject"
              icon={<Icon.Star width={16} height={16} />}
              value={ds.strongSubject ? ds.strongSubject : 'NA'}
              sub={ds.strongSubject ? <>contributes <b>{Number(ds.strongSubjectPercentage || 0).toFixed(0)}%</b> to total</> : 'no sufficient data'}
            />
          </div>
        </div>

        {/* WEEKLY EXAM SCORES */}
        {weeklyReports.length > 0 && (
          <Card>
            <div className="cp-card-head">
              <div>
                <h2>Weekly Exam Scores</h2>
                <p>Your scores from attempted weekly exams</p>
              </div>
              <Pill tone="ghost">{plural(weeklyReports.length, 'attempt')}</Pill>
            </div>
            <div className="cp-table-wrap">
              <table className="cp-table" style={{ minWidth: 560 }}>
                <thead>
                  <tr><th>Exam Name</th><th>Date</th><th>Score</th><th>Accuracy</th><th>Report</th></tr>
                </thead>
                <tbody>
                  {weeklyReports.map((r) => (
                    <tr key={r.attemptId}>
                      <td><strong>{r.title}</strong></td>
                      <td className="cp-td-muted">{r.dateOfExam}</td>
                      <td className="is-num">{r.score}</td>
                      <td><Pill tone="ghost" size="sm">{r.accuracy}%</Pill></td>
                      <td>
                        <div className="cp-row-actions">
                          <button type="button" className="cp-btn cp-btn-ghost cp-btn-sm" onClick={() => navigate(`/weekly-report?attemptId=${r.attemptId}`)}>View Report</button>
                          <button type="button" className="cp-btn cp-btn-light cp-btn-sm cp-btn-bordered" onClick={() => setStatsFor(r)}><Icon.BarChart width={14} height={14} /> Stats</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* PROGRESS REPORTS */}
        <Card>
          <div className="cp-card-head">
            <div>
              <h2>Progress Reports</h2>
              <p>Reports issued by your centre, newest first</p>
            </div>
            <div className="cp-portal-stats">
              {progressReports?.some((r) => r.sample) && <Pill tone="sky" size="sm">Sample data</Pill>}
              {progressReports && <Pill tone="ghost">{plural(progressReports.length, 'report')}</Pill>}
            </div>
          </div>
          {progressReports === null && <div className="cp-skeleton" style={{ minHeight: 96 }} aria-busy="true" />}
          {progressReports?.length === 0 && <p className="cp-empty">No progress reports have been issued yet. They appear here as soon as your centre publishes one.</p>}
          {progressReports?.length > 0 && (
            <div className="cp-table-wrap">
              <table className="cp-table" style={{ minWidth: 480 }}>
                <thead>
                  <tr><th>Date</th><th>Title</th><th>Report</th></tr>
                </thead>
                <tbody>
                  {progressReports.map((r) => (
                    <tr key={r.id}>
                      <td className="cp-td-muted" style={{ whiteSpace: 'nowrap' }}>{reportDate(r.issuedOn)}</td>
                      <td><strong>{r.title}</strong></td>
                      <td>
                        {r.url ? (
                          <a className="cp-btn cp-btn-ghost cp-btn-sm" href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${r.title}`}>
                            <span className="cp-pdf-icon"><Icon.FileText width={14} height={14} /></span> View
                          </a>
                        ) : (
                          <button type="button" className="cp-btn cp-btn-ghost cp-btn-sm" onClick={() => toast('Sample row. The PDF link will come from the progress-reports API.')}>
                            <span className="cp-pdf-icon"><Icon.FileText width={14} height={14} /></span> View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
