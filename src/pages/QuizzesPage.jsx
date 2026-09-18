import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Layout from '../components/Layout';
import { Icon } from '../components/Icons';
import { Card, Pill } from '../components/ui';
import { useToast } from '../components/Toast';
import SecretKeyDialog from '../components/SecretKeyDialog';
import { browserFingerprint } from '../lib/browser';
import { getCourseBundleProgress, getTestSeriesProgress, listWeeklyExams, startWeeklyExam } from '../lib/candidateApi';

// Every weekly-exam card shows the same artwork; the photo the API sends is not used.
const TILE_IMAGE = '/default-images/quiz-default.jpg';

/**
 * Weekly exams (quizzes) available to attempt. Shown only to candidates with
 * at least one test series or course, as before.
 */
export default function QuizzesPage() {
  const toast = useToast();
  const [exams, setExams] = useState(null); // null = loading
  const [access, setAccess] = useState(null); // null = unknown

  useEffect(() => {
    listWeeklyExams().then((data) => setExams(Array.isArray(data) ? data : [])).catch(() => setExams([]));
    Promise.allSettled([getTestSeriesProgress(), getCourseBundleProgress()]).then(([series, bundles]) => {
      const enrolledSeries = series.status === 'fulfilled' && (series.value?.testSeriesEnrolled || []).length > 0;
      const enrolledBundles = bundles.status === 'fulfilled' && (bundles.value?.enrolledCourses || []).length > 0;
      setAccess(enrolledSeries || enrolledBundles);
    });
  }, []);

  const [lockedQuiz, setLockedQuiz] = useState(null); // quiz waiting for its secret key

  // Start the exam. A locked quiz answers `secretKeyRequired` first; the
  // candidate types the key in a popup and the call is repeated with it.
  // Returns an error message to show, or null when the exam was opened.
  async function startQuiz(quizId, secret) {
    const response = await startWeeklyExam({ quiz: quizId, fingerprint: browserFingerprint(), secret });
    if (response.status === 'success' && response.data?.url) {
      const redirectUrl = `${response.data.url}&metadata=${encodeURIComponent(JSON.stringify(response.data.metadata))}`;
      window.open(redirectUrl, '_blank');
      return null;
    }
    if (response.secretKeyRequired || response.data?.secretKeyRequired) {
      if (!secret) { setLockedQuiz(quizId); return null; }
      return response.message || response.error || 'Incorrect secret key. Please try again.';
    }
    return response.message || response.error || 'Something went wrong';
  }

  async function attemptWeeklyExam(quizId) {
    try {
      const failure = await startQuiz(quizId);
      if (failure) toast(failure);
    } catch (err) {
      toast(err?.message || 'Something went wrong');
    }
  }

  async function submitSecret(secret) {
    const failure = await startQuiz(lockedQuiz, secret);
    if (!failure) setLockedQuiz(null);
    return failure;
  }

  const loading = exams === null || access === null;
  const list = access ? exams || [] : [];

  return (
    <Layout title="Quizzes">
      <SecretKeyDialog open={lockedQuiz !== null} onSubmit={submitSecret} onCancel={() => setLockedQuiz(null)} />
      <div className="cp-page">

        {loading && (
          <div className="cp-grid cp-grid-exams" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              // Same shape as a loaded tile: image, title, two lines, meta, button.
              <div key={i} className="cp-card cp-exam cp-exam-skeleton">
                <div className="cp-exam-media cp-skeleton" />
                <div className="cp-exam-body">
                  <span className="cp-skeleton is-line" />
                  <span className="cp-skeleton is-line is-title2" style={{ width: '55%' }} />
                  <span className="cp-skeleton is-line is-thin" />
                  <span className="cp-skeleton is-line is-thin" style={{ width: '80%' }} />
                  <span className="cp-skeleton is-line is-thin" style={{ width: '45%' }} />
                  <span className="cp-skeleton is-btn" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !access && (
          <Card className="cp-state">
            <span className="cp-state-icon"><Icon.Graduation /></span>
            <strong>Weekly exams unlock with a course</strong>
            <p>Enroll in a test series or course to start practising with weekly exams.</p>
            <NavLink className="cp-btn cp-btn-primary" to="/test-series">See test series</NavLink>
          </Card>
        )}

        {!loading && access && list.length === 0 && (
          <Card className="cp-state">
            <span className="cp-state-icon"><Icon.FileText /></span>
            <strong>No weekly exams right now</strong>
            <p>New practice tests appear here as soon as they are published.</p>
          </Card>
        )}

        {!loading && list.length > 0 && (
          <div className="cp-grid cp-grid-exams">
            {list.map((exam) => (
              <Card key={exam.id} className="cp-exam">
                <div className="cp-exam-media">
                  <img src={TILE_IMAGE} alt="" />
                  {exam.attempted
                    ? <Pill tone="lime"><Icon.Check width={13} height={13} /> Attempted</Pill>
                    : <Pill tone="sky">New</Pill>}
                </div>
                <div className="cp-exam-body">
                  <h4>{exam.title}</h4>
                  <p>{exam.brief}</p>
                  <div className="cp-exam-meta">
                    <span title="Duration"><Icon.Clock width={14} height={14} />{exam.duration} min</span>
                    <span title="Questions"><Icon.List width={14} height={14} />{exam.totalQuestions} Qs</span>
                  </div>
                  <button type="button" className="cp-btn cp-btn-primary" onClick={() => attemptWeeklyExam(exam.id)}>
                    {exam.attempted ? 'Re-attempt' : 'Start Exam'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
