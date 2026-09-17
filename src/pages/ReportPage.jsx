import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Icon } from '../components/Icons';
import { Card, Pill } from '../components/ui';
import QuestionModal from '../components/QuestionModal';
import { SectionStatsChart, SubjectStrengthDonut, TimeDistributionChart } from '../components/charts';
import { examQuestionImageUrl, getExamReport, getWeeklyExamReport, weeklyQuestionImageUrl } from '../lib/candidateApi';
import { getSearchParam } from '../lib/browser';
import { pct } from '../lib/format';
import { useUser } from '../components/UserProvider';

// This mapping is aligned with the backend config.
const TOPICS = {
  0: 'Uncategorised',
  1: 'Plus One - Physics',
  2: 'Plus One - Chemistry',
  3: 'Plus One - Mathematics',
  4: 'Plus One - Biology',
  5: 'Plus Two - Physics',
  6: 'Plus Two - Chemistry',
  7: 'Plus Two - Mathematics',
  8: 'Plus Two - Biology',
};
const topicName = (code) => TOPICS[code] || TOPICS[0];

const VARIANTS = {
  exam: {
    title: 'Performance Report',
    tag: 'Mock test report',
    blurb: 'Great job on completing your mock test! Every attempt brings you one step closer to mastering the exam. Keep practicing, analyze your performance, and strive for continuous improvement — success is built through consistency! 🚀',
    fetch: getExamReport,
    questionImage: examQuestionImageUrl,
    revisit: '/revisit',
    neutralWhenNoHistory: false,
  },
  weekly: {
    title: 'Weekly Exam Report',
    tag: 'Weekly exam report',
    blurb: 'Great job on completing your weekly test! Every attempt brings you one step closer to mastering the exam. Keep practicing, analyze your performance, and strive for continuous improvement — success is built through consistency! 🚀',
    fetch: getWeeklyExamReport,
    questionImage: weeklyQuestionImageUrl,
    revisit: '/weekly-revisit',
    neutralWhenNoHistory: true,
  },
};

function overallStats(sections = []) {
  let marks = 0; let unattempted = 0; let correct = 0; let incorrect = 0;
  sections.forEach(({ sectionSummary: s }) => {
    marks += s.totalMarks;
    correct += s.correct;
    unattempted += s.total - s.attempted;
    incorrect += s.attempted - s.correct;
  });
  return { correct, incorrect, unattempted, score: marks, total: correct + incorrect + unattempted };
}

function topicAccuracy(sections = []) {
  const stats = {};
  sections.forEach((section) => {
    section.questions.forEach(({ topic, answer, attempt }) => {
      const attempted = attempt !== '';
      if (!stats[topic]) stats[topic] = { correct: 0, attempted: 0 };
      if (attempted) {
        stats[topic].attempted += 1;
        if (attempt === answer) stats[topic].correct += 1;
      }
    });
  });
  return Object.entries(stats)
    .map(([topic, s]) => [topic, s.attempted > 0 ? (s.correct / s.attempted) * 100 : 0])
    .sort(([, a], [, b]) => b - a)
    .map(([topic, accuracy]) => ({ topic: parseInt(topic, 10), accuracy: Math.round(accuracy) }));
}

// Width of the three segments of a subject bar as percentages of its total.
function coverage(s) {
  const wrong = s.attempted - s.correct;
  const correctPct = (s.correct / s.total) * 100;
  const wrongPct = (wrong / s.total) * 100;
  return { correct: `${correctPct}%`, wrong: `${wrongPct}%`, unattempted: `${100 - (correctPct + wrongPct)}%` };
}

function overallCoverage(o) {
  const correctPct = (o.correct / o.total) * 100;
  const wrongPct = (o.incorrect / o.total) * 100;
  return { correct: `${correctPct}%`, wrong: `${wrongPct}%`, unattempted: `${100 - (correctPct + wrongPct)}%` };
}

function SubjectBar({ correct, unattempted, wrong, widths }) {
  return (
    <div className="progress">
      <div className="progress-bar progress-bar-success" style={{ width: widths.correct }}>{correct}</div>
      <div className="progress-bar progress-bar-unattempted" style={{ width: widths.unattempted }}>{unattempted}</div>
      <div className="progress-bar progress-bar-danger" style={{ width: widths.wrong }}>{wrong}</div>
    </div>
  );
}

const Legend = ({ squares }) => (
  <div className={`cp-legend ${squares ? 'is-squares' : ''}`}>
    <span><i className="is-correct" />Correct</span>
    <span><i className="is-wrong" />{squares ? 'Wrongly answered' : 'Wrong'}</span>
    <span><i className="is-skipped" />{squares ? 'Spent time but not answered' : 'Unattempted'}</span>
  </div>
);

export default function ReportPage({ variant = 'exam' }) {
  const cfg = VARIANTS[variant];
  const navigate = useNavigate();
  const attemptId = decodeURIComponent(getSearchParam('attemptId') ?? 'null');
  const [report, setReport] = useState(null);
  const [found, setFound] = useState(true);
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    let alive = true;
    cfg.fetch(attemptId)
      .then((data) => { if (alive) { setReport(data); setFound(true); } })
      .catch(() => { if (alive) setFound(false); });
    return () => { alive = false; };
  }, [cfg, attemptId]);

  const sections = report?.sectionWiseResponse || [];
  const overall = useMemo(() => overallStats(sections), [sections]);
  const topics = useMemo(() => topicAccuracy(sections), [sections]);

  function openQuestion(questionId) {
    sections.forEach((section) => {
      section.questions.forEach((q) => {
        if (String(questionId) === String(q.qi)) setQuestion({ ...q, sectionName: section.sectionName });
      });
    });
  }

  function openSolutionsView() {
    if (attemptId && Number(attemptId) > 1) navigate(`${cfg.revisit}?attemptId=${attemptId}&question=1&section=1`);
  }

  // Score / strike-rate deltas against the previous attempt in the series.
  const prevScore = parseInt(report?.previousScoreInSeries, 10);
  const prevStrike = parseInt(report?.previousStrikeRateInSeries, 10);
  const noHistory = cfg.neutralWhenNoHistory && (!report?.hasOtherAttempts || Number.isNaN(prevScore));
  const noStrikeHistory = cfg.neutralWhenNoHistory && (!report?.hasOtherAttempts || Number.isNaN(prevStrike));
  const scoreUp = Number(report?.totalScore) >= prevScore;
  const strikeUp = Number(report?.strikeRate) >= prevStrike;
  const scoreDelta = Number(report?.totalScore) - prevScore;
  const strikeDelta = Number(report?.strikeRate) - prevStrike;

  const scoreIcon = noHistory ? <Icon.Medal className="blueTileIcon" width={17} height={17} />
    : scoreUp ? <Icon.TrendUp className="greenTileIcon" width={17} height={17} /> : <Icon.TrendDown className="redTileIcon" width={17} height={17} />;
  const strikeIcon = <Icon.Bolt className={noStrikeHistory ? 'blueTileIcon' : strikeUp ? 'greenTileIcon' : 'redTileIcon'} width={17} height={17} />;

  const backTo = { path: '/performance', label: 'My Performance' };

  if (!found) {
    return (
      <Layout title={cfg.title} backTo={backTo}>
        <section className="cp-card cp-state is-page">
          <span className="cp-state-icon is-warn"><Icon.Sad /></span>
          <strong>Sorry, report not found.</strong>
          <p>The report you are looking for is not available. Head back to My Performance to pick another attempt.</p>
          <a className="cp-btn cp-btn-primary" href="/performance">Go to My Performance</a>
        </section>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title={cfg.title} backTo={backTo}>
        <div className="cp-page" aria-busy="true">
          <div className="cp-card cp-skeleton" />
          <div className="cp-grid cp-grid-2"><div className="cp-card cp-skeleton" /><div className="cp-card cp-skeleton" /></div>
        </div>
      </Layout>
    );
  }

  const q = report.questionLevel || {};
  const summaryTiles = variant === 'weekly'
    ? [
      { cls: 'is-correct', top: overall.correct, bottom: overall.total, label: 'Correct' },
      { cls: 'is-skipped', top: overall.unattempted, bottom: overall.total, label: 'Skipped' },
      { cls: 'is-wrong', top: overall.incorrect, bottom: overall.total, label: 'Wrong' },
    ]
    : [
      { cls: 'toughnessTileGreen', top: q['1']?.attempted, bottom: q['1']?.total, label: 'Easy' },
      { cls: 'toughnessTileYellow', top: q['2']?.attempted, bottom: q['2']?.total, label: 'Medium' },
      { cls: 'toughnessTileRed', top: q['3']?.attempted, bottom: q['3']?.total, label: 'Hard' },
    ];

  return (
    <Layout title={cfg.title} backTo={backTo}>
      <QuestionModal open={Boolean(question)} question={question} imageUrl={question ? cfg.questionImage(question.qi) : ''} onClose={() => setQuestion(null)} />

      <div className="cp-page">
        {/* HERO */}
        <Card className="is-dark cp-report-hero">
          <div className="cp-hero-top">
            <div>
              <small>{cfg.tag}</small>
              <h2>Great Going <ProfileName />!</h2>
              <p>{report.customisedSummary} {cfg.blurb}</p>
            </div>
            <button type="button" className="cp-btn cp-btn-amber view-all-btn" onClick={openSolutionsView}>View Solutions</button>
          </div>
        </Card>

        {/* SUMMARY TILES */}
        <div className="cp-report-kpis">
          <Card>
            <div className="cp-kpi-head"><h2>Score</h2><span className="cp-kpi-icon">{scoreIcon}</span></div>
            <div className="cp-kpi-value"><strong>{report.totalScore} <small>/ {report.scoreBase}</small></strong></div>
            {report.hasOtherAttempts && scoreDelta > 0 && <span className="cp-tile-delta greenTileIcon"><Icon.ArrowUp width={14} height={14} /> +{scoreDelta} marks from last test</span>}
            {report.hasOtherAttempts && scoreDelta < 0 && <span className="cp-tile-delta redTileIcon"><Icon.ArrowDown width={14} height={14} /> {scoreDelta} marks from last test</span>}
          </Card>
          <Card>
            <div className="cp-kpi-head"><h2>Strike Rate</h2><span className="cp-kpi-icon">{strikeIcon}</span></div>
            <div className="cp-kpi-value"><strong>{pct(report.strikeRate)}%</strong></div>
            {report.hasOtherAttempts && strikeDelta > 0 && <span className="cp-tile-delta greenTileIcon"><Icon.ArrowUp width={14} height={14} /> +{pct(strikeDelta)}% up from last test</span>}
            {report.hasOtherAttempts && strikeDelta < 0 && <span className="cp-tile-delta redTileIcon"><Icon.ArrowDown width={14} height={14} /> {pct(strikeDelta)}% down from last test</span>}
          </Card>
          <Card>
            <div className="cp-kpi-head"><h2>Position</h2><span className="cp-kpi-icon"><Icon.Medal className="blueTileIcon" width={17} height={17} /></span></div>
            <div className="cp-kpi-value"><strong>{report.globalAverage} <small>/ {report.scoreBase}</small></strong></div>
            <span className="cp-kpi-sub"><Icon.Globe width={13} height={13} /> average of all candidates</span>
          </Card>
          <Card>
            <div className="cp-kpi-head"><h2>{variant === 'weekly' ? 'Questions Summary' : 'Attempted Questions'}</h2></div>
            <div className="toughnessTileContainer">
              {summaryTiles.map((tile) => (
                <div className="toughnessTileItem" key={tile.label}>
                  <div className={`toughnessTileCircle ${tile.cls}`}>
                    <div className="toughnessTileTop">{tile.top}</div>
                    <div className="toughnessTileLine" />
                    <div className="toughnessTileBottom">{tile.bottom}</div>
                  </div>
                  <div className="toughnessTileLabel">{tile.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RESPONSE SHEET + SUBJECT WISE */}
        <div className="cp-grid cp-grid-report-mid">
          <Card>
            <div className="cp-card-head">
              <div>
                <h2>Response Sheet</h2>
                <p><b>{report.title}</b>{report.startedAt ? ` · taken at ${report.startedAt}` : ''}</p>
              </div>
              <Legend />
            </div>
            {sections.map((section) => (
              <div className="responseSheet" key={section.sectionName}>
                <div className="responseSheetTitle">
                  <span className="responseSheetName">{section.sectionName}</span>
                  <span className="responseSheetSummary">
                    {section.sectionSummary.correct} Correct <i className="cp-dot" /> {section.sectionSummary.attempted - section.sectionSummary.correct} Wrong <i className="cp-dot" /> {section.sectionSummary.totalMarks} Marks
                  </span>
                </div>
                <div className="responseSheetNumbers">
                  {[...section.questions].sort((a, b) => a.order - b.order).map((item) => {
                    const wrong = item.attempt !== '' && item.answer !== item.attempt;
                    const correct = item.attempt !== '' && item.answer === item.attempt;
                    return (
                      <button
                        type="button"
                        key={item.order}
                        className={`responseSheetIcon ${wrong ? 'wrongAnswer' : ''} ${correct ? 'correctAnswer' : ''}`}
                        title={`Question ${item.order}`}
                        onClick={() => setQuestion({ ...item, sectionName: section.sectionName })}
                      >
                        {item.order}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="cp-foot-note">Tap any question number to see the question, your answer and the correct option.</p>
          </Card>

          <Card>
            <div className="cp-card-head">
              <h2>Subject-wise</h2>
              <Pill tone="ghost">{overall.score} marks</Pill>
            </div>
            <div className="cp-subjects">
              {sections.map((section) => {
                const s = section.sectionSummary;
                return (
                  <div className="cp-subject" key={section.sectionName}>
                    <p className="subjectLine">
                      <span>{section.sectionName} {section.sectionName === report.mostScoredSection && <Icon.Star className="subjectLineStar" width={13} height={13} />}</span>
                      <span className="markLabelResponse">{s.totalMarks} marks</span>
                    </p>
                    <SubjectBar correct={s.correct} unattempted={s.total - s.attempted} wrong={s.attempted - s.correct} widths={coverage(s)} />
                  </div>
                );
              })}
              <div className="cp-subject is-overall">
                <p className="subjectLine"><span>Overall</span> <span className="markLabelResponse">{overall.score} marks</span></p>
                <SubjectBar correct={overall.correct} unattempted={overall.unattempted} wrong={overall.incorrect} widths={overallCoverage(overall)} />
              </div>
              <Legend />
            </div>
          </Card>
        </div>

        <div className="mobileOnlyReportFooter">
          <button type="button" className="cp-btn cp-btn-primary cp-btn-block" onClick={openSolutionsView}>View Solutions</button>
        </div>

        {/* CRISPR INSIGHTS */}
        <div className="cp-section-head">
          <div className="cp-section-head-text">
            <h2>Crispr Insights</h2>
            <p>A deeper look at how you performed across sections, subjects and topics</p>
          </div>
        </div>

        <div className="cp-grid cp-grid-insights">
          <Card>
            <div className="cp-card-head"><h2>Section Wise Stats</h2></div>
            <SectionStatsChart sections={sections} />
          </Card>
          <Card>
            <div className="cp-card-head"><h2>Subject Strength</h2></div>
            <SubjectStrengthDonut sections={sections} />
          </Card>
          <Card>
            <div className="cp-card-head"><h2>Topic Wise Accuracy</h2></div>
            <div className="cp-topic-scroll">
              <table className="cp-table cp-topic-table">
                <tbody>
                  {topics.map((t) => (
                    <tr key={t.topic}>
                      <td>{topicName(t.topic)}</td>
                      <td className="text-right is-num">{t.accuracy}%</td>
                      <td style={{ width: 120 }}>
                        <div className="progress"><div className="progress-bar progress-bar-teal" style={{ width: `${t.accuracy}px` }} /></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <div className="cp-card-head">
            <div>
              <h2>Time Distribution</h2>
              <p>Seconds spent on each question. Tap a bar to open that question.</p>
            </div>
            <Legend squares />
          </div>
          <TimeDistributionChart sections={sections} onOpenQuestion={openQuestion} />
        </Card>
      </div>
    </Layout>
  );
}

// The greeting uses the candidate's profile name from the shell context.
function ProfileName() {
  const { profile } = useUser() || {};
  return <>{profile?.name || ''}</>;
}
