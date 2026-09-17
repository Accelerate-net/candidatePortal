// Tiny stand-in for the candidate APIs so the portal can be developed and
// demoed without CrisprTechApp. Opt in per run with VITE_API_BASE; by default
// the app talks to https://crisprtech.app/crispr-apis. Any mobile logs in with OTP 1234.
//   node scripts/mock-api.mjs        (http://127.0.0.1:8098/crispr-apis)
//   VITE_API_BASE=http://127.0.0.1:8098/crispr-apis npm run dev
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 8098);
const PREFIX = '/crispr-apis';
const IMG = (seed, w = 400, h = 240) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const question = (topic, i) => {
  const answer = 'ABCD'[i % 4];
  const r = i % 5;
  const attempt = r === 0 ? '' : r === 1 ? 'ABCD'[(i + 1) % 4] : answer;
  return { qi: topic * 100 + i, order: i, topic, answer, attempt, timeSpent: 20 + ((i * 37) % 120), level: ['Easy', 'Medium', 'Hard'][i % 3], marks: attempt === '' ? 0 : attempt === answer ? 4 : -1 };
};
const section = (name, topic, n = 15) => {
  const questions = Array.from({ length: n }, (_, i) => question(topic, i + 1));
  const attempted = questions.filter((q) => q.attempt !== '').length;
  const correct = questions.filter((q) => q.attempt !== '' && q.attempt === q.answer).length;
  return { sectionName: name, sectionSummary: { total: n, attempted, correct, totalMarks: correct * 4 - (attempted - correct) }, questions };
};
const sections = () => [section('Physics', 1), section('Chemistry', 2), section('Mathematics', 3), section('Biology', 4)];

const profile = {
  name: 'Aarav Menon', aspiration: 'Aspiring Scientist', photo: '', joined: '12 Mar 2025', about: 'I love physics and want to pursue research at IISER.',
  dob: '14-06-2008', gender: 'Male', place: 'Ernakulam', fatherName: 'Suresh Menon', motherName: 'Latha Menon', classOfStudy: 'Class 12 Going',
  lastInstitution: 'Bhavans Vidya Mandir', board: 'CBSE', yearOfPassing: '2026', registeredMobile: '9876543210', communicationMobile: '9876543210',
  email: 'aarav@example.com', idPhoto: '',
  offlineOnboarded: true,
  courses: [
    { title: 'IAT 2026 Grand Test Series', type: 'Test Series', metadata: { commencement: 'Jun 2025', conclusion: 'May 2026' }, accessLevel: 'Premium', expiry: '31 May 2026' },
    { title: 'IAT 2026 Booster Series', type: 'Test Series', accessLevel: 'Free', expiry: 'Unknown' },
    { title: 'Class 12 Physics Video Course', type: 'Course', accessLevel: 'Free', expiry: 'Unknown' },
  ],
};

// A brand-new account, for exercising the profile-completion popup: use the
// token "newuser". Saves are kept in memory for the life of the server.
// `newuser`: no name, no courses, not an offline student. The main profile is an offline course student.
let newUserProfile = { ...profile, name: 'Crisprite', email: '', place: '', courses: [], offlineOnboarded: false };
const isNewUser = (req) => (req.headers.authorization || '') === 'Bearer newuser';

const ok = (data, extra = {}) => ({ status: 'success', data, ...extra });

// Attendance: every month from June 2026 to now, Sundays off, a deterministic
// mix of present / absent class days, future days upcoming.
function attendance() {
  const today = new Date();
  const months = [];
  const first = new Date(2026, 5, 1);
  for (let d = new Date(today.getFullYear(), today.getMonth(), 1); d >= first; d = new Date(d.getFullYear(), d.getMonth() - 1, 1)) {
    const y = d.getFullYear(); const m = d.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    let present = 0; let absent = 0; const days = [];
    for (let day = 1; day <= dim; day += 1) {
      const dt = new Date(y, m, day);
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let status;
      if (dt > today) status = 'upcoming';
      else if (dt.getDay() === 0) status = 'off';
      else if (iso < '2026-06-15') status = 'off';
      else status = (day * 7 + m) % 9 === 0 ? 'absent' : 'present';
      if (status === 'present') present += 1;
      if (status === 'absent') absent += 1;
      days.push({ date: iso, day, weekday: dt.getDay(), status });
    }
    const total = present + absent;
    months.push({ key: `${y}-${String(m + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), present, absent, total, percent: total ? Math.round((present / total) * 100) : 0, days });
  }
  return { percent: 88, percentDelta: 3, tracked: true, months };
}

const routes = {
  'GET /user/attendance.php': () => ok(attendance()),
  // Recently watched on the course page (user/watch-history.php); the new user has none.
  'GET /user/watch-history.php': (_b, url, req) => {
    const wanted = (url.searchParams.get('course') || '').split(',').filter(Boolean);
    const size = parseInt(url.searchParams.get('size'), 10) || 3;
    const now = Math.floor(Date.now() / 1000);
    const rows = [
      { contentMetadata: { course: 1, module: 1, chapter: 1, part: 2 }, type: 'VIDEO', title: "Part 2: Coulomb's Law", duration: 1324, progress: 529, completed: '40%', lastWatch: '', lastWatchEpoch: now - 3 * 3600, thumbnail: '' },
      { contentMetadata: { course: 1, module: 1, chapter: 1, part: 1 }, type: 'VIDEO', title: 'Part 1: Electric Charge', duration: 980, progress: 980, completed: '100%', lastWatch: '', lastWatchEpoch: now - 2 * 86400, thumbnail: IMG('wh1', 480, 270) },
      { contentMetadata: { course: 1, module: 2, chapter: 1, part: 1 }, type: 'VIDEO', title: "Part 1: Ohm's Law", duration: 1500, progress: 120, completed: '8%', lastWatch: '', lastWatchEpoch: now - 9 * 86400, thumbnail: '' },
    ];
    if (isNewUser(req)) return ok([]);
    return ok(rows.filter((r) => wanted.length === 0 || wanted.includes(String(r.contentMetadata.course))).slice(0, size));
  },
  'GET /user/progress-reports.php': () => ok([
    { id: 3, title: 'July - September Session', issuedOn: null, fileType: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: 'PR-2026-Q3', title: 'Progress Report July - September', issuedOn: '2026-09-07', fileType: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: 'PR-2026-Q2', title: 'Progress Report April - June', issuedOn: '2026-06-08', fileType: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ]),
  'POST /user/authenticate.php': () => ok('demo-key', { message: 'OTP sent to +91 98XXXXXX10' }),
  'POST /user/login.php': (body) => (body.passcode === '1234' ? ok('demo-token') : { status: 'error', error: 'Incorrect OTP' }),
  'GET /user/user-profile.php': (_b, _u, req) => ok(isNewUser(req) ? newUserProfile : profile),
  'POST /user/update-profile.php': (body, _u, req) => { if (isNewUser(req)) newUserProfile = { ...newUserProfile, ...body }; return ok({}); },
  'POST /user/upload-profile-photo.php': (body) => ok(body.photo),
  'POST /user/upload-id-photo.php': (body) => ok(body.photo),
  'POST /user/remove-id-photo.php': () => ok({}),
  'GET /user/dashboard-summary.php': () => ok({
    name: profile.name, aspiration: profile.aspiration, photo: '',
    dashboardSummary: { strikeRate: 6234, strikeRateFrom: 5, averageScore: 15600, averageScoreFrom: 5, averageScoreBase: 240, pyqSolved: 132, pyqSolvedFrom: 480, strongSubject: 'Chemistry', strongSubjectPercentage: 38.2 },
  }),
  'GET /user/test-series-progress.php': (_b, url) => {
    const id = url.searchParams.get('id') || 'IAT26';
    return ok({
      testSeriesEnrolled: [{ code: 'IAT26', title: 'IAT 2026 Grand Test Series' }, { code: 'IAT26B', title: 'IAT 2026 Booster Series' }],
      currentTestSeriesInfo: { code: id, series: 'S1' },
      coursesList: [
        { key: 'M1', title: 'Mock Test 1', brief: 'Full syllabus mock for IAT 2026, pattern aligned with the real exam.', photo: IMG('m1'), lastScore: 15600, lastAttempted: '2026-08-20', previousAttemptId: 101, availableForAttempt: true, premium: true },
        { key: 'M2', title: 'Mock Test 2', brief: 'Full syllabus mock for IAT 2026.', photo: IMG('m2'), lastScore: 17200, lastAttempted: '2026-08-27', previousAttemptId: 102, availableForAttempt: true },
        { key: 'M3', title: 'Mock Test 3', brief: 'Full syllabus mock for IAT 2026.', photo: IMG('m3'), availableForAttempt: true },
        { key: 'M4', title: 'Mock Test 4', brief: 'Premium mock. Get membership to unlock.', photo: IMG('m4'), locked: true },
      ],
    });
  },
  // The `newuser` token has no courses, to show the catalog banner.
  'GET /user/course-bundle-progress.php': (_b, _u, req) => (isNewUser(req) ? ok({ enrolledCourses: [], coursesMetadata: {} }) : ok({
    enrolledCourses: [{ id: 1, title: 'Class 12 Physics Video Course' }, { id: 2, title: 'Class 11 Chemistry Video Course' }],
    coursesMetadata: {
      1: { modules: { 1: { name: 'Electrostatics' }, 2: { name: 'Current Electricity' } }, chapters: [{ moduleId: 1, chapterNumber: 1, title: 'Electric Charges and Fields', url: '/course/view-course.html?course=1&module=1&chapter=1&view=0' }, { moduleId: 1, chapterNumber: 2, title: 'Electrostatic Potential', url: '' }, { id: '9', moduleId: 1, chapterNumber: 1, title: 'Dual Nature of Radiation (Plus Two)', url: '#' }, { moduleId: 2, chapterNumber: 1, title: "Ohm's Law", url: '#' }] },
      2: { modules: { 1: { name: 'Atomic Structure' } }, chapters: [{ moduleId: 1, chapterNumber: 1, title: 'Bohr model', url: '#' }] },
    },
  })),
  'GET /user/quiz/list-quiz.php': () => ok([
    { id: 8, title: 'Weekly Test 18 · Chemical Bonding', brief: 'VSEPR, hybridisation and molecular orbital theory.', photo: IMG('h', 400, 200), duration: 45, totalQuestions: 30, attempted: false },
    { id: 7, title: 'Weekly Test 17 · Cell Biology', brief: 'Cell organelles, membranes and the cell cycle.', photo: IMG('g', 400, 200), duration: 30, totalQuestions: 20, attempted: false },
    { id: 6, title: 'Weekly Test 16 · Calculus', brief: 'Limits, continuity and differentiation.', photo: IMG('f', 400, 200), duration: 60, totalQuestions: 40, attempted: false },
    { id: 5, title: 'Weekly Test 15 · Electrostatics', brief: "Coulomb's law, electric field and potential.", photo: IMG('e', 400, 200), duration: 45, totalQuestions: 30, attempted: true },
    { id: 4, title: 'Weekly Test 14 · Genetics', brief: 'Mendelian inheritance and molecular basis of inheritance.', photo: IMG('d', 400, 200), duration: 30, totalQuestions: 20, attempted: true },
    { id: 2, title: 'Weekly Test 13 · Kinematics', brief: 'Motion in one and two dimensions.', photo: IMG('b', 400, 200), duration: 45, totalQuestions: 30, attempted: false },
    { id: 1, title: 'Weekly Test 12 · Organic Chemistry', brief: 'Reactions of alcohols, phenols and ethers.', photo: IMG('a', 400, 200), duration: 45, totalQuestions: 30, attempted: true },
    { id: 3, title: 'Weekly Test 11 · Thermodynamics', brief: 'Laws of thermodynamics, enthalpy and entropy.', photo: IMG('c', 400, 200), duration: 45, totalQuestions: 30, attempted: true },
  ]),
  'GET /user/quiz/quiz-summary.php': () => ok([
    { attemptId: 13, quizId: 5, title: 'Weekly Test 15 · Electrostatics', dateOfExam: '03 Oct 2026', score: '92 / 120', accuracy: 82 },
    { attemptId: 12, quizId: 4, title: 'Weekly Test 14 · Genetics', dateOfExam: '26 Sep 2026', score: '58 / 80', accuracy: 74 },
    { attemptId: 11, quizId: 1, title: 'Weekly Test 12 · Organic Chemistry', dateOfExam: '12 Sep 2026', score: '84 / 120', accuracy: 78 },
    { attemptId: 10, quizId: 3, title: 'Weekly Test 11 · Thermodynamics', dateOfExam: '05 Sep 2026', score: '66 / 120', accuracy: 61 },
  ]),
  'GET /user/quiz/quiz-stats.php': (_b, url) => ok({
    quizId: Number(url.searchParams.get('quizId')), attemptId: Number(url.searchParams.get('attemptId')) || 13, title: 'Weekly Test 15 · Electrostatics',
    maxScore: 120, myScore: 92, myRank: 4, classStrength: 46, topScore: 112, classAverage: 71.5,
    subjects: [
      { name: 'Physics', myScore: 34, classAverage: 25.5, topScore: 40, maxScore: 40 },
      { name: 'Chemistry', myScore: 30, classAverage: 24, topScore: 38, maxScore: 40 },
      { name: 'Mathematics', myScore: 28, classAverage: 22, topScore: 36, maxScore: 40 },
    ],
  }),
  'POST /user/quiz/start-quiz.php': () => ok({ url: 'https://example.com/quiz?x=1', metadata: { demo: true } }),
  'POST /user/start-exam.php': (body) => (body.exam === 'M3' ? ok({ url: 'https://example.com/exam?attempt=1', metadata: { demo: true } }) : { status: 'error', message: 'Test already in progress' }),
  'GET /user/exam-report.php': () => ok({
    title: 'Mock Test 2', startedAt: '27 Aug 2026, 10:00 AM', customisedSummary: 'You scored above the batch average this time.',
    totalScore: 172, scoreBase: 240, strikeRate: 7150, globalAverage: 151, hasOtherAttempts: true, previousScoreInSeries: '156', previousStrikeRateInSeries: '6234',
    mostScoredSection: 'Chemistry', questionLevel: { 1: { attempted: 18, total: 20 }, 2: { attempted: 16, total: 24 }, 3: { attempted: 8, total: 16 } }, sectionWiseResponse: sections(),
  }),
  'GET /user/quiz/quiz-report.php': () => ok({
    title: 'Weekly Test 12', startedAt: '12 Sep 2026', customisedSummary: '', totalScore: 84, scoreBase: 120, strikeRate: 7800, globalAverage: 71,
    hasOtherAttempts: true, previousScoreInSeries: '66', previousStrikeRateInSeries: '6100', mostScoredSection: 'Chemistry', sectionWiseResponse: sections().slice(0, 3),
  }),
  'POST /user/revisit-solution.php': (body) => ok({
    sectionData: { 1: ['Physics', 15], 2: ['Chemistry', 15], 3: ['Mathematics', 15], 4: ['Biology', 15] },
    topic: 'Plus One - Physics', chapter: 'Kinematics', level: 'Medium',
    questionURL: IMG(`q${body.section}-${body.question}`, 800, 420), solutionURL: IMG(`s${body.section}-${body.question}`, 800, 700), attempt: 'B', answer: 'C',
  }),
  'GET /user/courses/get-course-progress.php': () => ok({
    modules: [{ id: '1', name: 'Electrostatics', chapters: [{ id: '1', code: 'CH01', title: 'Electric Charges and Fields', teacher: { name: 'Dr. Meera Nair', brief: 'Physics faculty', photo: 'https://img.icons8.com/color/100/user.png' }, parts: [
      { id: '0', title: 'Introduction to charge', directory: 'demo', source: 'demo', duration: 720, progress: 720 },
      { id: '1', title: "Coulomb's law", directory: 'demo', source: 'demo', duration: 1440, progress: 600 },
      { id: '2', title: 'Electric field lines', directory: 'demo', source: 'demo', duration: 1080, progress: 0 },
    ] }] }],
  }),
  'POST /user/courses/save-course-progress.php': () => ok({}),
  'GET /user/get-billing-address.php': () => ok({ mobile: '9876543210', name: 'Aarav Menon', address: '', locality: '', city: 'Kochi', state: 'Kerala', pincode: '', email: 'aarav@example.com' }),
  'POST /public/courses.php': (_b, url) => {
    const catalog = [
      { code: 'IAT26', type: 'Test Series', title: 'IAT 2026 Grand Test Series', brief: '20 full-length mocks', photo: IMG('cat1'), isDiscountApplicable: true, originalPrice: 699900, sellingPrice: 499900 },
      { code: 'IAT26B', type: 'Test Series', title: 'IAT 2026 Booster Series', brief: 'Subject-wise boosters', photo: IMG('cat2'), isDiscountApplicable: false, originalPrice: 199900, sellingPrice: 199900 },
      { code: 'IATFREE', type: 'Test Series', title: 'IAT Free Starter Mocks', brief: 'Two free mocks', photo: IMG('cat3'), isDiscountApplicable: false, originalPrice: 0, sellingPrice: 0 },
      { code: 'NEST26', type: 'Test Series', title: 'NEST 2026 Test Series', brief: '12 mocks for NEST', photo: '', isDiscountApplicable: true, originalPrice: 399900, sellingPrice: 299900 },
      { code: 'CR0004', type: 'Course', title: 'IAT 2026 - Exclusive 1 Year Course', brief: '', photo: IMG('cat5'), isDiscountApplicable: false, originalPrice: 2499900, sellingPrice: 2499900 },
    ];
    const code = url.searchParams.get('code');
    if (!code) return ok(catalog);
    return ok(catalog.find((c) => c.code === code) || { code, title: 'IAT 2026 Grand Test Series', type: 'Test Series', sellingPrice: 499900 });
  },
  'POST /user/checkout/validate-user-cart.php': (body) => ok({
    cart: body.cart,
    summary: { subTotal: body.cart.reduce((s, i) => s + i.unitPrice * i.number, 0), discount: { amount: body.code ? 50000 : 0, code: body.code }, taxes: [{ label: 'GST 18%', value: 89982 }], extras: [], totalPayable: 589882 },
  }),
  'POST /user/checkout/process-purchase.php': () => ({ status: 'error', error: 'Payments are disabled in the mock API' }),
  'POST /user/checkout/acknowledge-purchase.php': () => ok({}),
};

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(PREFIX, '');
  if ((req.headers.authorization || '') === 'Bearer expired') { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ status: 'error', error: 'Unauthorised' })); return; }
  if (path.startsWith('/user/render-question.php') || path.startsWith('/user/quiz/render')) {
    res.writeHead(302, { Location: IMG(`render${url.searchParams.get('id')}`, 800, 420) }); res.end(); return;
  }
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
    const handler = routes[`${req.method} ${path}`];
    res.setHeader('Content-Type', 'application/json');
    if (!handler) { res.writeHead(404); res.end(JSON.stringify({ status: 'error', error: `No mock for ${req.method} ${path}` })); return; }
    setTimeout(() => { res.writeHead(200); res.end(JSON.stringify(handler(body, url, req))); }, 150);
  });
}).listen(PORT, () => console.log(`mock candidate API on http://127.0.0.1:${PORT}${PREFIX} (OTP 1234)`));
