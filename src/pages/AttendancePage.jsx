import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import MonthPicker from '../components/MonthPicker';
import { Icon } from '../components/Icons';
import { Card, Pill } from '../components/ui';
import { getAttendance } from '../lib/candidateApi';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function tone(percent) {
  if (percent >= 85) return 'lime';
  if (percent >= 70) return 'sky';
  return 'orange';
}

function label(percent) {
  if (percent >= 85) return 'High';
  if (percent >= 70) return 'Fair';
  return 'Low';
}

function formatDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Mon–Sun calendar for one month; days[] is complete and ordered (see README).
function AttendanceGrid({ month }) {
  const cells = useMemo(() => {
    if (!month?.days?.length) return [];
    const lead = (month.days[0].weekday + 6) % 7; // JS weekday 0 = Sunday → Monday column 0
    return [...Array.from({ length: lead }, () => null), ...month.days];
  }, [month]);

  if (!month) return null;
  return (
    <div className="cp-att">
      <div className="cp-att-head">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cp-att-grid">
        {cells.map((c, i) => {
          if (!c) return <span key={`pad-${i}`} className="cp-att-cell is-empty" />;
          // Present/absent are shown as a green/red ring around the date (see attendance.css).
          const title = `${formatDay(c.date)} · ${c.status}`;
          return (
            <span key={c.date} className={`cp-att-cell is-${c.status}`} title={title} aria-label={title}>
              <small>{c.day}</small>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Offline (classroom) attendance: 30-day percentage, month calendar with a
 * month picker, and a consolidated month-by-month summary.
 */
export default function AttendancePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [monthKey, setMonthKey] = useState('');

  useEffect(() => {
    getAttendance()
      .then((d) => { setData(d); setMonthKey(d?.months?.[0]?.key || ''); })
      .catch((e) => setError(e?.message || 'Could not load attendance.'));
  }, []);

  const months = data?.months || [];
  const month = months.find((m) => m.key === monthKey) || months[0];

  // Consolidated figures across every month returned (academic year so far).
  const overall = useMemo(() => {
    const present = months.reduce((s, m) => s + (m.present || 0), 0);
    const absent = months.reduce((s, m) => s + (m.absent || 0), 0);
    const counted = present + absent;
    return { present, absent, counted, percent: counted ? Math.round((present / counted) * 100) : 0 };
  }, [months]);

  // Current run of consecutive present class days, newest first.
  const streak = useMemo(() => {
    const days = months.flatMap((m) => m.days || []).filter((d) => d.status === 'present' || d.status === 'absent');
    days.sort((a, b) => (a.date < b.date ? 1 : -1));
    let n = 0;
    for (const d of days) { if (d.status === 'present') n += 1; else break; }
    return n;
  }, [months]);

  const tracked = data?.tracked !== false && months.length > 0;
  const delta = Number(data?.percentDelta || 0);

  return (
    <Layout title="Attendance">
      <div className="cp-page">
        {error && (
          <Card className="cp-state">
            <strong>Couldn't load attendance</strong>
            <p>{error}</p>
            <button type="button" className="cp-btn cp-btn-primary" onClick={() => window.location.reload()}>Try again</button>
          </Card>
        )}

        {!error && !data && (
          <div className="cp-grid cp-grid-2" aria-busy="true">
            <div className="cp-card cp-skeleton" />
            <div className="cp-card cp-skeleton" />
          </div>
        )}

        {data && !tracked && (
          <Card className="cp-state">
            <span className="cp-state-icon"><Icon.Calendar /></span>
            <strong>Attendance is not tracked for you yet</strong>
            <p>Offline attendance appears here once your centre starts marking it for your batch.</p>
          </Card>
        )}

        {data && tracked && (
          <>
            {/* SUMMARY TILES: four in a row on desktop */}
            <div className="cp-kpi-grid cp-att-kpis">
              <Card>
                <div className="cp-kpi-head">
                  <h2>Last 30 days</h2>
                  <span className="cp-kpi-icon"><Icon.Calendar width={16} height={16} /></span>
                </div>
                <div className="cp-kpi-value">
                  <strong>{data.percent}%</strong>
                  <Pill tone={tone(data.percent)}>{label(data.percent)}</Pill>
                </div>
                <p className="cp-kpi-sub">
                  {delta !== 0 && (
                    <span className={`cp-trend ${delta > 0 ? 'is-up' : 'is-down'}`}>
                      {delta > 0 ? <Icon.ArrowUp width={13} height={13} /> : <Icon.ArrowDown width={13} height={13} />}{Math.abs(delta)}%
                    </span>
                  )}
                  {delta !== 0 ? ' vs the previous 30 days' : 'same as the previous 30 days'}
                </p>
              </Card>
              <Card>
                <div className="cp-kpi-head">
                  <h2>This month</h2>
                  <span className="cp-kpi-icon"><Icon.Check width={16} height={16} /></span>
                </div>
                <div className="cp-kpi-value"><strong>{months[0]?.present ?? 0} <small>/ {months[0]?.total ?? 0}</small></strong></div>
                <p className="cp-kpi-sub">classes attended in {months[0]?.label}</p>
              </Card>
              <Card>
                <div className="cp-kpi-head">
                  <h2>Since June</h2>
                  <span className="cp-kpi-icon"><Icon.BarChart width={16} height={16} /></span>
                </div>
                <div className="cp-kpi-value"><strong>{overall.percent}%</strong></div>
                <p className="cp-kpi-sub"><b>{overall.present}</b> present · <b>{overall.absent}</b> absent of {overall.counted} class days</p>
              </Card>
              <Card>
                <div className="cp-kpi-head">
                  <h2>Current streak</h2>
                  <span className="cp-kpi-icon"><Icon.Flash width={16} height={16} /></span>
                </div>
                <div className="cp-kpi-value"><strong>{streak} <small>day{streak === 1 ? '' : 's'}</small></strong></div>
                <p className="cp-kpi-sub">consecutive classes attended</p>
              </Card>
            </div>

            {/* Last 3 months · calendar, 1:1 on desktop */}
            <div className="cp-grid cp-grid-attendance">
              {/* LAST 3 MONTHS (months[] is newest first) */}
              <Card>
                <div className="cp-card-head">
                  <h2>Last 3 months</h2>
                  <Pill tone="ghost">{Math.min(months.length, 3)} month{Math.min(months.length, 3) === 1 ? '' : 's'}</Pill>
                </div>
                <ul className="cp-att-months">
                  {months.slice(0, 3).map((m) => (
                    <li key={m.key} className={`cp-att-month ${m.key === month?.key ? 'is-active' : ''}`}>
                      <button type="button" className="cp-att-month-btn" onClick={() => setMonthKey(m.key)}>
                        <div className="cp-att-month-row">
                          <strong>{m.label}</strong>
                          <span className="cp-att-month-val">
                            {m.total > 0 ? <b>{m.percent}%</b> : <small>No classes</small>}
                          </span>
                        </div>
                        <div className="cp-bar" aria-hidden="true">
                          <div className={`cp-bar-fill is-${tone(m.percent)}`} style={{ width: `${m.total ? Math.max(2, Math.min(100, m.percent)) : 0}%` }} />
                        </div>
                        <small className="cp-att-month-meta">{m.present} present · {m.absent} absent · {m.total} class day{m.total === 1 ? '' : 's'}</small>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="cp-att-total">
                  <span>Academic year so far</span>
                  <strong>{overall.present} / {overall.counted} <small>({overall.percent}%)</small></strong>
                </div>
              </Card>

              {/* CALENDAR */}
              <Card>
                <div className="cp-card-head">
                  <h2>Class attendance</h2>
                  <MonthPicker months={months} value={month?.key} onChange={setMonthKey} />
                </div>
                <AttendanceGrid month={month} />
                <div className="cp-att-legend">
                  <span><i className="is-present" /> Present {month?.present ?? 0}</span>
                  <span><i className="is-absent" /> Absent {month?.absent ?? 0}</span>
                  <span><i className="is-off" /> Holiday / off</span>
                  <span><i className="is-upcoming" /> Upcoming</span>
                </div>
              </Card>

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
