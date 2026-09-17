# Crispr Learning · Candidate Portal

Mobile-first React SPA for students of Crispr Learning. Students sign in with
their mobile number (OTP) and get:

| Route                              | Screen        | What it shows |
| ---------------------------------- | ------------- | ------------- |
| `/start`                           | Login         | Mobile number + OTP, welcome slider (`/` and `/index.html` redirect here) |
| `/performance`                | My Performance | Strike rate / average score tiles, weekly exam scores with report + class stats, progress reports |
| `/test-series?id=`                 | Test Series   | Enrolled test series (cover header with a "Switch series" menu; `?id=` is the open series code) with mock-test tiles and a condensed score bar chart |
| `/courses?id=&module=`             | Courses       | Landing page after login. Catalog banner, a row of catalog test-series tiles (`/public/courses.php`, only for candidates with no course), then enrolled video-course bundles (cover header with a "Switch course" menu; `?id=` is the open course id, `&module=` the open module tab) with module tabs and chapters |
| `/quizzes`                         | Quizzes       | Weekly exams available to attempt |
| `/attendance`                      | Attendance    | Offline attendance: 30-day %, month calendar, month-by-month summary |
| `/profile`                    | Profile       | About, enrolled courses, edit details, profile photo and ID-card photo (cropped in the browser) |
| `/report?attemptId=`          | Report        | Mock-test performance report: response sheet, subject-wise bars, section stats, subject strength, topic accuracy, time distribution |
| `/weekly-report?attemptId=`   | Weekly report | Same for weekly exams (quizzes) |
| `/revisit?attemptId=`         | Revisit       | Question-by-question review with solutions |
| `/weekly-revisit?attemptId=`  | Weekly revisit| Same for weekly exams |
| `/course?…`       | Course player | Chapter parts with progress rings and the Bunny video stream (progress saved via player.js) |
| `/checkout`   | Checkout      | Cart, OTP login, billing address, gift code, Razorpay payment |

All routes are clean paths served by the SPA fallback. The historical page
URLs (`/index.html`, `/dashboard.html`, `/report.html?attemptId=…`,
`/course/view-course.html?…`, `/secure-checkout/checkout.html?addItem=…`) are
still linked from the exam portal, e-mails and bookmarks, so each redirects to
its clean route with the query string intact: `vite.config.js` rewrites them
to `index.html` in dev and `scripts/postbuild.mjs` emits a copy of
`index.html` at each of them (plus `404.html`) in `dist/`.

Stack and layout mirror `herosPortal`: Vite 7, React 19, react-router-dom 7,
axios, plain CSS with tokens. Charts use Recharts; photo cropping uses
Cropper.js; HEIC photos are converted with heic2any.

Colours follow crisprlearning.com: deep teal `#005f73` for primary actions and
headings, amber `#ffb703` for highlights, pink-red `#ff3b6b` / dark green
`#146a62` / slate `#94a3b8` for wrong / correct / skipped. All tokens live in
`src/styles/base/tokens.css`.

## Run

```bash
npm install
npm run dev        # http://localhost:5175 (also reachable on your LAN for phone testing)
npm run build      # -> dist/ (plus the legacy page copies)
npm run preview
```

The portal talks to the PHP APIs in `CrisprTechApp/crispr-apis` at
`https://crisprtech.app/crispr-apis` by default. `VITE_API_BASE` overrides
the origin and prefix (see `.env.example`).

## Attendance API

`/attendance` reads `GET /user/attendance.php` (candidate Bearer token), which
is not in CrisprTechApp yet. It must return the same object the parent portal
gets under `attendance` from `parent/student-360.php`, so that script's
attendance block can be reused as-is with the candidate's id:

```json
{ "status": "success", "data": {
  "percent": 92, "percentDelta": 3, "tracked": true,
  "months": [ { "key": "2026-09", "label": "September 2026", "present": 4, "absent": 1, "total": 5, "percent": 80,
    "days": [ { "date": "2026-09-01", "day": 1, "weekday": 2, "status": "present" } ] } ]
} }
```

`months` is current month first back to June 2026; `days` covers every day of
the month in order; `weekday` uses the JavaScript convention (0 = Sunday);
`status` is `present | absent | holiday | off | upcoming`. `tracked: false`
(or an empty `months`) shows the "not tracked yet" state.

## Performance APIs (pending)

Two parts of `/performance` still wait for their backend:

* **Class stats** (the "Stats" button on a weekly exam row). `getExamStats()` in
  `src/lib/candidateApi.js` returns sample numbers from `src/data/performanceDemo.js`.
  Swap its body for the real call; the dialog expects
  `{ myScore, maxScore, topScore, classAverage, myRank, classStrength, subjects: [{ name, myScore, classAverage, topScore, maxScore }] }`
  and shows a "Sample data" pill while `sample: true`.
* **Progress reports**: `GET /user/progress-reports.php` returning
  `[{ id, title, issuedOn: "YYYY-MM-DD", fileType: "pdf", url }]`, newest first.
  Until the endpoint exists the page falls back to sample rows without a link.

## Who sees what

* **Quizzes** and **Attendance** (menu items and the `/quizzes`, `/attendance`
  routes) are only for candidates whose profile lists at least one enrolment
  that is not a test series. Un-enrolled and test-series-only accounts are sent
  to `/courses` instead.
* **My Performance** (menu item and `/performance`) needs at least one enrolment
  of any kind, course or test series.
* The **ID Card Photo** tab of `/profile` only shows when the profile has
  `offlineOnboarded: true` (classroom students). Missing counts as false.

Both checks live in `src/lib/profile.js`.

## Watch history

`/courses` shows the last three videos watched in the open course ("Recently
watched"). The course player records every video it opens, and how far it was
watched, in this browser (`localStorage`, see `src/lib/watchHistory.js`). Set
`VITE_WATCH_HISTORY_URL` to the watch-history API to read the history from the
server instead, so it follows the candidate across devices. Until there is any
history, sample cards built from the course's first chapters are shown with a
"Sample data" pill (`src/data/watchHistoryDemo.js`). Posters are
generated; a `thumbnail` URL on a history item is used when present.

## Mock API

By default every run, including `npm run dev`, talks to the live
`https://crisprtech.app/crispr-apis`. `scripts/mock-api.mjs` answers every
endpoint the portal calls with sample data for working without the backend;
opt in per run with `VITE_API_BASE`:

```bash
node scripts/mock-api.mjs                                  # http://127.0.0.1:8098/crispr-apis
VITE_API_BASE=http://127.0.0.1:8098/crispr-apis npm run dev
```

Any 10-digit mobile logs in with OTP `1234`. Do not commit a `.env.development`
pointing at the mock, or the dev server will stop hitting the real APIs.

## Layout

```
src/
  main.jsx, App.jsx            entry + routes (Protected redirects to /start?next= without a session)
  lib/api.js                   axios client, base URL resolution, 401 -> /start?next=
  lib/auth.js                  session cookie (crispriteUserToken, 7 days)
  lib/candidateApi.js          every endpoint the portal calls
  lib/cart.js                  localStorage cart + gift code
  lib/browser.js               fingerprint, script loader, query-string helpers
  lib/format.js                percentages, durations, amounts, masking
  lib/profile.js               place list, missing-field checks, full update payload
  components/Layout            sidebar (desktop) / bottom tab bar (mobile), sign-out confirm
  components/UserProvider      logged-in candidate profile for the shell
  components/ProfilePrompt     popup after login when name (mandatory), email or place is not set
  components/Toast             bottom-centre toaster (useToast)
  components/ConfirmDialog     centred confirm modal
  components/QuestionModal     question preview + answer review chips
  components/charts            progress line, section bars, subject donut, time distribution
  components/WelcomeSlider     login slides (same copy as the mobile app)
  components/ui.jsx            Card, Pill, Avatar, KpiCard, PageState
  pages/                       LoginPage, PerformancePage, TestSeriesPage, CoursesPage, QuizzesPage, AttendancePage, ProfilePage, ReportPage, RevisitPage, CoursePage, CheckoutPage
  lib/legacyRoutes.js          old .html page URLs -> clean routes (shared by App, vite.config, postbuild)
  styles/app.css               index only: @imports the partials below in cascade order
  styles/base/                 tokens.css (design tokens), reset.css
  styles/components/           shell, primitives, modals, tile-dropdown, hero
  styles/pages/                one file per page; course-player.css and checkout.css are imported
                               by their page component and ship with that page's lazy chunk
  styles/responsive.css        shared layout breakpoints, imported last
public/                        logo, slider images (WebP), tile icons, player.js, CNAME
scripts/                       postbuild (legacy page copies), mock API
server/                        PHP scripts that belong to the API, kept here for reference
design-src/                    full-size PNG originals of the slider artwork (not deployed)
```

Login and Courses ship in the main bundle; every other page is a lazy chunk
(`React.lazy` in `src/App.jsx`) that is prefetched when the browser is idle, so
Recharts, Cropper.js and the checkout only download when needed. React and the
router are split into their own long-cached `react` chunk (`vite.config.js`).

`server/upload-id-photo.php` and `server/remove-id-photo.php` are the
server-side scripts for the ID-card photo; they are deployed with the API,
not with this app.
