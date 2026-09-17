import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import TileDropdown from '../components/TileDropdown';
import { useUser } from '../components/UserProvider';
import { Icon } from '../components/Icons';
import { Card, Pill } from '../components/ui';
import { ProgressChart } from '../components/charts';
import { useToast } from '../components/Toast';
import { browserFingerprint, getSearchParam, replaceSearchParam } from '../lib/browser';
import { pct, plural } from '../lib/format';
import { getTestSeriesProgress, startExam } from '../lib/candidateApi';
import { isNameMissing } from '../lib/profile';

// "Attempt this exam" hand-off from the start page:
//   /test-series?action=ATTEMPT&courseCode=<series code>&examCode=<exam key>
// (parentMetadata / childMetadata are accepted too). Read once, at mount.
function readHandoff() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') !== 'ATTEMPT') return null;
  const courseCode = params.get('courseCode') || params.get('parentMetadata');
  const examCode = params.get('examCode') || params.get('childMetadata');
  if (!courseCode || !examCode) return null;
  return { courseCode, examCode, requested: false, done: false };
}

// Status icon on each mock-test tile: locked / available / attempted.
function courseIconClass(course) {
  if (course.locked) return 'lockedIcon';
  if (course.previousAttemptId) return '';
  if (!course.previousAttemptId && course.availableForAttempt) return 'availableIcon';
  return '';
}

/**
 * Enrolled test series: pick a series, see its mock tests (attempt, score
 * card, membership) and the score trend across attempts.
 */
export default function TestSeriesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [courseListing, setCourseListing] = useState({});
  const [courseListingFound, setCourseListingFound] = useState(null); // null = loading
  const [courseIdOpen, setCourseIdOpen] = useState(null);
  const [inProgress, setInProgress] = useState(null); // { examKey, seriesKey, sameTab }
  const [premiumFor, setPremiumFor] = useState(null); // series code awaiting the premium confirmation
  const [seriesMeta, setSeriesMeta] = useState({}); // code -> { photo, total, attempted }
  const handoff = useRef(undefined);
  if (handoff.current === undefined) handoff.current = readHandoff();
  const metaRequested = useRef(new Set());
  const { profile, loading: profileLoading } = useUser() || {};

  // Artwork and test counts for a series come from its own listing.
  const recordMeta = useCallback((data) => {
    const code = data?.currentTestSeriesInfo?.code;
    if (!code) return;
    const list = data.coursesList || [];
    setSeriesMeta((m) => ({
      ...m,
      [code]: { photo: list.find((c) => c.photo)?.photo || null, total: list.length, attempted: list.filter((c) => c.previousAttemptId).length },
    }));
  }, []);

  // Only the latest request may update the page, so a slow earlier response
  // can never put the dropdown and the listing out of step.
  const requestSeq = useRef(0);
  const getCourseListingData = useCallback(async (id) => {
    const seq = ++requestSeq.current;
    if (id) setCourseIdOpen(id);
    try {
      const data = await getTestSeriesProgress(id);
      recordMeta(data);
      if (seq !== requestSeq.current) return;
      // A requested series the candidate is not enrolled in: open the first one instead.
      const enrolled = data?.testSeriesEnrolled || [];
      if (id && enrolled.length > 0 && !enrolled.some((t) => String(t.code) === String(id))) {
        replaceSearchParam('id', null);
        getCourseListingData();
        return;
      }
      setCourseListing(data);
      setCourseListingFound(true);
      const openCode = data?.currentTestSeriesInfo?.code || id || data?.testSeriesEnrolled?.[0]?.code || null;
      setCourseIdOpen(openCode);
      if (openCode) replaceSearchParam('id', openCode); // /test-series?id=<series code>
    } catch {
      if (seq !== requestSeq.current) return;
      // An unknown ?id= falls back to the candidate's first series.
      if (id) { replaceSearchParam('id', null); getCourseListingData(); } else setCourseListingFound(false);
    }
  }, [recordMeta]);

  // Open the series named in ?id= when present, else the first one.
  useEffect(() => { getCourseListingData(getSearchParam('id') || undefined); }, [getCourseListingData]);

  // Fill in the tiles of the series that are not open, once each, in the background.
  useEffect(() => {
    (courseListing?.testSeriesEnrolled || []).forEach(({ code }) => {
      if (seriesMeta[code] || metaRequested.current.has(code) || code === courseListing?.currentTestSeriesInfo?.code) return;
      metaRequested.current.add(code);
      getTestSeriesProgress(code).then(recordMeta).catch(() => {});
    });
  }, [courseListing, seriesMeta, recordMeta]);

  // `sameTab` is used by the automatic hand-off: a new window opened without a
  // click would be blocked as a popup, so the exam opens in this tab instead.
  const attemptExam = useCallback(async (examKey, seriesKey, forced, sameTab = false) => {
    const continueExam = forced === 1;
    try {
      const response = await startExam({ exam: examKey, series: seriesKey, fingerprint: browserFingerprint(), continueExam });
      if (response.status === 'success') {
        let redirectUrl = response.data.url;
        if (!continueExam) redirectUrl += `&metadata=${encodeURIComponent(JSON.stringify(response.data.metadata))}`;
        if (sameTab) window.location.assign(redirectUrl);
        else window.open(redirectUrl, '_blank');
      } else {
        toast(response.message || response.error);
        if (response.message === 'Test already in progress') setInProgress({ examKey, seriesKey, sameTab });
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong');
    }
  }, [toast]);

  // Locked (premium) exams ask before leaving for the checkout.
  const askPremium = useCallback((testSeriesCode) => setPremiumFor(testSeriesCode), []);

  // Hand-off, step by step:
  //   1. wait until the page's data is in (series listing + profile, and a
  //      mandatory name prompt, if any, has been answered);
  //   2. if the requested series is one of the candidate's, select it;
  //   3. once that listing has loaded, trigger the requested exam tile:
  //      free -> start the exam, locked -> premium confirmation.
  useEffect(() => {
    const h = handoff.current;
    if (!h || h.done) return;
    if (!courseListingFound || profileLoading || isNameMissing(profile)) return;

    const finish = () => {
      h.done = true;
      const open = courseListing?.currentTestSeriesInfo?.code;
      window.history.replaceState(null, '', `${window.location.pathname}${open ? `?id=${encodeURIComponent(open)}` : ''}`);
    };
    const series = (courseListing?.testSeriesEnrolled || []).find((t) => String(t.code) === String(h.courseCode));
    if (!series) { finish(); toast('That test series is not available in your account.'); return; }

    if (String(courseListing?.currentTestSeriesInfo?.code) !== String(h.courseCode)) {
      if (!h.requested) { h.requested = true; getCourseListingData(series.code); }
      return; // wait for the requested series to load
    }

    const item = (courseListing.coursesList || []).find((c) => String(c.key) === String(h.examCode));
    finish();
    if (!item) { toast('That exam is not part of this test series.'); return; }

    document.getElementById(`attempt_${series.code}_${item.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (item.locked) askPremium(series.code);
    else if (item.availableForAttempt) attemptExam(item.key, courseListing.currentTestSeriesInfo.series, undefined, true);
    else toast('This exam is not open for attempts right now.');
  }, [courseListingFound, courseListing, profile, profileLoading, attemptExam, askPremium, getCourseListingData, toast]);

  const enrolled = courseListing?.testSeriesEnrolled || [];

  // Access level and validity live on the profile's enrolled courses; match by title.
  const accessByTitle = useMemo(() => {
    const map = {};
    (profile?.courses || []).forEach((c) => { if (c?.title) map[c.title.trim().toLowerCase()] = c; });
    return map;
  }, [profile]);

  const seriesItems = enrolled.map((series) => {
    const access = accessByTitle[(series.title || '').trim().toLowerCase()];
    const meta = seriesMeta[series.code];
    const premium = access?.accessLevel === 'Premium';
    const badges = [];
    if (access?.accessLevel) badges.push({ label: `${access.accessLevel} access`, tone: premium ? 'sky' : 'ghost', icon: premium ? Icon.Crown : undefined });
    const validity = access ? (access.expiry && access.expiry !== 'Unknown' ? `Access till ${access.expiry}` : 'Unlimited access') : null;
    const tests = meta ? `${plural(meta.total, 'mock test')}${meta.total ? ` · ${meta.attempted} attempted` : ''}` : null;
    const stats = meta ? [{ value: meta.total, label: meta.total === 1 ? 'Mock test' : 'Mock tests' }, { value: meta.attempted, label: 'Attempted' }] : [];
    return { id: series.code, title: series.title, image: series.photo || meta?.photo || null, fallbackIcon: Icon.Desktop, badges, meta: [validity, tests], coverMeta: [validity], stats };
  });
  const coursesList = courseListing?.coursesList || [];
  const showProgressChart = courseListingFound && coursesList.some((c) => c.previousAttemptId);

  return (
    <Layout title="Test Series" hideTitle>
      <ConfirmDialog
        open={Boolean(inProgress)}
        title="Exam In Progress"
        message="The exam you are trying to attempt is already in progress. To continue, make sure you are using the same device and network on which you initially started. Otherwise, you may be unable to proceed."
        confirmLabel="Continue Exam"
        cancelLabel="Hide"
        tone="success"
        onConfirm={() => { const p = inProgress; setInProgress(null); attemptExam(p.examKey, p.seriesKey, 1, p.sameTab); }}
        onCancel={() => setInProgress(null)}
      />
      <ConfirmDialog
        open={Boolean(premiumFor)}
        title="Premium access needed"
        message="You need to have premium access to this exam to attempt it. Do you want to continue?"
        confirmLabel="Continue"
        cancelLabel="Not now"
        onConfirm={() => { const code = premiumFor; setPremiumFor(null); navigate(`/checkout?addItem=${code}`); }}
        onCancel={() => setPremiumFor(null)}
      />

      <div className="cp-page">
        {courseListingFound === null && <div className="cp-skeleton cp-cover-skeleton" aria-busy="true" />}

        {enrolled.length > 0 && (
          <TileDropdown
            variant="cover"
            label="Test series"
            switchLabel="Switch series"
            items={seriesItems}
            value={courseIdOpen}
            onChange={(code) => getCourseListingData(code)}
          />
        )}

        {courseListingFound === false && (
          <Card>
            <div className="cp-state">
              <span className="cp-state-icon"><Icon.Graduation /></span>
              <p>Enroll in test series to start practicing</p>
              <a href="https://crisprlearning.com/courses/" target="new" className="cp-btn cp-btn-primary">Enroll Now</a>
            </div>
          </Card>
        )}

        {courseIdOpen && (
          <div className="cp-grid cp-grid-series">
            <div className="courseContentContainer">
              {coursesList.map((course) => (
                <div key={course.key} className={`courseContentTile ${course.locked ? 'blockedCourseContent' : ''}`}>
                  {course.lastScore ? (
                    <div className="courseContentSummary"><span>Scored <b>{pct(course.lastScore)}</b> on {course.lastAttempted}</span></div>
                  ) : null}
                  <div className={`courseContentIcon ${courseIconClass(course)}`} />
                  <img src={course.photo} alt="" />
                  <div className="courseContentTileContent">
                    {!course.locked && course.premium && <div className="premiumContentIcon" title="Premium Content"><Icon.Crown width={13} height={13} /></div>}
                    <h5>{course.title}</h5>
                    <p className="multiline-ellipsis">{course.brief}</p>
                    {!course.locked ? (
                      <span>
                        {course.availableForAttempt && (
                          <a
                            role="button"
                            tabIndex={0}
                            id={`attempt_${courseListing.currentTestSeriesInfo?.code}_${course.key}`}
                            onClick={() => attemptExam(course.key, courseListing.currentTestSeriesInfo?.series)}
                          >
                            {course.previousAttemptId ? 'Attempt Again' : 'Attempt Now'}
                          </a>
                        )}
                        {course.previousAttemptId && (
                          <a role="button" tabIndex={0} className="viewReport" onClick={() => navigate(`/report?attemptId=${course.previousAttemptId}`)}>Score Card</a>
                        )}
                      </span>
                    ) : (
                      <span>
                        <a
                          role="button"
                          tabIndex={0}
                          className="courseContentPurchase"
                          id={`attempt_${courseListing.currentTestSeriesInfo?.code}_${course.key}`}
                          onClick={() => askPremium(courseListing.currentTestSeriesInfo?.code)}
                        >
                          <Icon.Crown width={14} height={14} /> Get Membership
                        </a>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showProgressChart && (
              <Card>
                <div className="cp-card-head"><h2>Your Progress</h2></div>
                <ProgressChart courses={coursesList} />
                <div className="cp-legend is-squares" style={{ justifyContent: 'center', marginTop: 8 }}>
                  <span><i className="is-correct" />Attempted (score)</span>
                  <span><i className="is-not-attempted" />Not attempted</span>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
