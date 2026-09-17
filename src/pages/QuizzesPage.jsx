import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Layout from '../components/Layout';
import { Icon } from '../components/Icons';
import { Card, Pill } from '../components/ui';
import { useToast } from '../components/Toast';
import { browserFingerprint } from '../lib/browser';
import { getCourseBundleProgress, getTestSeriesProgress, listWeeklyExams, startWeeklyExam } from '../lib/candidateApi';

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

  async function attemptWeeklyExam(quizId) {
    try {
      const response = await startWeeklyExam({ quiz: quizId, fingerprint: browserFingerprint() });
      if (response.status === 'success') {
        const redirectUrl = `${response.data.url}&metadata=${encodeURIComponent(JSON.stringify(response.data.metadata))}`;
        window.open(redirectUrl, '_blank');
      } else {
        toast(response.message || response.error);
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong');
    }
  }

  const loading = exams === null || access === null;
  const list = access ? exams || [] : [];

  return (
    <Layout title="Quizzes">
      <div className="cp-page">
        <div className="cp-section-head">
          <div className="cp-section-head-text">
            <h2>Weekly Exams</h2>
            <p>Stay exam-ready with your weekly practice tests</p>
          </div>
          {!loading && access && <Pill tone="ghost">{list.length} {list.length === 1 ? 'quiz' : 'quizzes'}</Pill>}
        </div>

        {loading && (
          <div className="cp-grid cp-grid-exams" aria-busy="true">
            <div className="cp-card cp-skeleton" />
            <div className="cp-card cp-skeleton" />
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
                  <img src={exam.photo} alt={exam.title} />
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
