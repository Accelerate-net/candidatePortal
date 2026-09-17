import { api, apiUrl } from './api';
import { getToken } from './auth';

/**
 * Candidate-portal API surface. Every function returns the plain payload the
 * pages need; envelope handling lives here. The PHP scripts answer
 * { status: "success", data } or { status: "error"|"failed", error|message }.
 *
 * Functions that the old pages branched on (e.g. "Test already in progress")
 * return the raw envelope so callers keep the same decisions.
 */

export class ApiError extends Error {
  constructor(body, fallback) {
    super((body && (body.error || body.message)) || fallback || 'Something went wrong');
    this.body = body || {};
  }
}

function unwrap(res, fallback) {
  const body = res?.data;
  if (body && typeof body === 'object' && body.status === 'success') return body.data;
  throw new ApiError(body, fallback);
}

const raw = (res) => (res?.data && typeof res.data === 'object' ? res.data : {});

// ── Auth ──────────────────────────────────────────────────────────────────
// countryCode is the digits without "+" (e.g. "91"). Both calls return the
// raw envelope: authenticate's `data` is the OTP key on success or a
// retry-after number of seconds on failure.
export async function authenticate({ mobile, countryCode }) {
  const payload = countryCode ? { username: mobile, countryCode } : { username: mobile };
  return raw(await api.post('/user/authenticate.php', payload));
}

export async function login({ mobile, countryCode, passcode, key }) {
  const payload = countryCode
    ? { username: mobile, countryCode, passcode, key }
    : { username: mobile, passcode, key };
  return raw(await api.post('/user/login.php', payload));
}

// ── Profile ───────────────────────────────────────────────────────────────
export async function getProfile() {
  return unwrap(await api.get('/user/user-profile.php'));
}

export async function updateProfile(data) {
  return raw(await api.post('/user/update-profile.php', data));
}

export async function uploadProfilePhoto(photoDataUrl) {
  return raw(await api.post('/user/upload-profile-photo.php', { photo: photoDataUrl }));
}

export async function uploadIdPhoto(photoDataUrl) {
  return raw(await api.post('/user/upload-id-photo.php', { photo: photoDataUrl }));
}

export async function removeIdPhoto() {
  return raw(await api.post('/user/remove-id-photo.php', {}));
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export async function getDashboardSummary() {
  return unwrap(await api.get('/user/dashboard-summary.php'));
}

export async function getTestSeriesProgress(id) {
  return unwrap(await api.get(`/user/test-series-progress.php${id ? `?id=${encodeURIComponent(id)}` : ''}`));
}

export async function getCourseBundleProgress() {
  return unwrap(await api.get('/user/course-bundle-progress.php'));
}

export async function listWeeklyExams() {
  return unwrap(await api.get('/user/quiz/list-quiz.php?page=1&size=10'));
}

export async function getWeeklyExamSummary() {
  return unwrap(await api.get('/user/quiz/quiz-summary.php'));
}

export async function startWeeklyExam({ quiz, fingerprint }) {
  return raw(await api.post('/user/quiz/start-quiz.php?termsAccepted=0', { quiz, fingerprint }));
}

export async function startExam({ exam, series, fingerprint, continueExam = false }) {
  const query = `?termsAccepted=0${continueExam ? '&continue=1' : ''}`;
  return raw(await api.post(`/user/start-exam.php${query}`, { exam, series, fingerprint }));
}

// ── My Performance ────────────────────────────────────────────────────────
// Class statistics for one quiz attempt, from user/quiz/quiz-stats.php:
// { quizId, attemptId, title, maxScore, myScore, myRank, classStrength, topScore,
//   classAverage, subjects: [{ name, myScore, classAverage, topScore, maxScore }] }
// `report` is a row of getWeeklyExamSummary() ({ quizId, attemptId, ... }).
// The API answers 404 with a message when the report is not generated yet.
export async function getExamStats(report) {
  const params = new URLSearchParams({ quizId: report?.quizId ?? '' });
  if (report?.attemptId) params.set('attemptId', report.attemptId);
  try {
    return unwrap(await api.get(`/user/quiz/quiz-stats.php?${params}`));
  } catch (err) {
    if (err?.response?.data && typeof err.response.data === 'object') throw new ApiError(err.response.data);
    throw err;
  }
}

// Progress report PDFs issued by the centre, from user/progress-reports.php:
// [{ id, title, url, issuedOn, fileType }] (`issuedOn` is null: the table has no
// date). The page hides the section when there is nothing to show, so a failed
// call counts as "no reports".
export async function getProgressReports() {
  try {
    const data = unwrap(await api.get('/user/progress-reports.php'));
    return Array.isArray(data) ? data.filter((r) => r?.url) : [];
  } catch (err) {
    if (err?.response?.status === 401) throw err;
    return [];
  }
}

// ── Attendance ────────────────────────────────────────────────────────────
// Offline attendance for the logged-in candidate. Same shape as the parent
// portal's `attendance` object (student-360.php): { percent, percentDelta,
// tracked, months: [{ key, label, present, absent, total, percent, days: [{ date, day, weekday, status }] }] }
export async function getAttendance() {
  return unwrap(await api.get('/user/attendance.php'));
}

// ── Reports ───────────────────────────────────────────────────────────────
export async function getExamReport(attemptId) {
  return unwrap(await api.get(`/user/exam-report.php?id=${encodeURIComponent(attemptId)}`));
}

export async function getWeeklyExamReport(attemptId) {
  return unwrap(await api.get(`/user/quiz/quiz-report.php?id=${encodeURIComponent(attemptId)}`));
}

export function examQuestionImageUrl(questionId) {
  return apiUrl(`user/render-question.php?id=${encodeURIComponent(questionId)}`);
}

export function weeklyQuestionImageUrl(questionId) {
  return apiUrl(`user/quiz/render-question.php?id=${encodeURIComponent(questionId)}`);
}

// Weekly exam questions/solutions render as <img>, so the token travels as a
// query parameter instead of a header.
export function weeklyRevisitQuestionUrl(questionId) {
  return apiUrl(`user/quiz/render-question.php?id=${encodeURIComponent(questionId)}&token=${encodeURIComponent(getToken())}`);
}

export function weeklyRevisitSolutionUrl(questionId) {
  return apiUrl(`user/quiz/render-quiz-solution.php?id=${encodeURIComponent(questionId)}&token=${encodeURIComponent(getToken())}`);
}

export async function getRevisitSolution({ id, section, question }) {
  return unwrap(await api.post('/user/revisit-solution.php', { id, section, question }));
}

// ── Course player ─────────────────────────────────────────────────────────
export async function getCourseProgress({ courseId, moduleId, chapterId, partId }) {
  const q = new URLSearchParams({ courseId, moduleId, chapterId, partId }).toString();
  return raw(await api.get(`/user/courses/get-course-progress.php?${q}`));
}

export async function saveCourseProgress(payload) {
  return raw(await api.post('/user/courses/save-course-progress.php', payload));
}

// Latest videos watched in the given player courses (course-bundle ids), newest
// first: user/watch-history.php, read from candidate_course_progress.
// [{ contentMetadata: { course, module, chapter, part }, type, title, duration, progress, completed, lastWatch, lastWatchEpoch, thumbnail }]
export async function getWatchHistoryRows(courseIds, size) {
  const data = unwrap(await api.get('/user/watch-history.php', { params: { course: courseIds.join(','), size } }));
  return Array.isArray(data) ? data : [];
}

// ── Checkout ──────────────────────────────────────────────────────────────
export async function getBillingAddress() {
  return raw(await api.get('/user/get-billing-address.php'));
}

// Every active catalog item: [{ code, type: 'Course' | 'Test Series', title, brief, photo, originalPrice, sellingPrice (paise), … }]
export async function listCatalog() {
  const res = raw(await api.post('/public/courses.php'));
  return Array.isArray(res?.data) ? res.data : [];
}

export async function lookupCourse(code) {
  return raw(await api.post(`/public/courses.php?code=${encodeURIComponent(code)}`));
}

export async function validateCart({ cart, code }) {
  return raw(await api.post('/user/checkout/validate-user-cart.php', { cart, code }));
}

export async function processPurchase(payload) {
  return raw(await api.post('/user/checkout/process-purchase.php', payload));
}

export async function acknowledgePurchase(payload) {
  return raw(await api.post('/user/checkout/acknowledge-purchase.php', payload));
}
