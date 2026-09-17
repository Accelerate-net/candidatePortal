# Quiz Stats API ("Stats" popup on `/performance`)

The **Stats** button on each row of "Weekly Exam Scores" opens the "Class stats"
popup (`src/components/ExamStatsDialog.jsx`). The popup makes one call, keyed by
`quizId`, and renders everything from its response.

It is served by `CrisprTechApp/user/quiz/quiz-stats.php`, next to
`quiz-summary.php` and `quiz-report.php`. The portal is not wired to it yet:
`getExamStats()` in `src/lib/candidateApi.js` still resolves with generated
numbers from `src/data/performanceDemo.js` and the popup shows a "Sample data"
pill (see "Wiring it into the portal" below). This is the contract the popup is
written against.

## Request

```
GET {API_BASE}/user/quiz/quiz-stats.php?quizId=5
Authorization: Bearer <crispriteUserToken>
```

- `API_BASE` is `https://crisprtech.app/crispr-apis` (or `VITE_API_BASE`).
- The candidate comes from the token (`$TOKEN_USER_ID`, as in the other
  `user/quiz/*.php` scripts).
- CORS: allow `Content-Type, Authorization`; methods `GET, OPTIONS`.

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `quizId` | int | yes | `quiz_config.id`. Every row of `quiz-summary.php` already carries it as `quizId`. |
| `attemptId` | int | no | The candidate's own attempt to report as "my score". Defaults to their latest completed attempt of this quiz. Only matters when a candidate has attempted the same quiz more than once, so that the popup matches the row it was opened from. |

## Response

Standard envelope. The popup reads `data` only when `status` is `"success"`.

```json
{
  "status": "success",
  "data": {
    "quizId": 5,
    "attemptId": 13,
    "title": "Weekly Test 15 · Electrostatics",
    "maxScore": 120,
    "myScore": 92,
    "myRank": 6,
    "classStrength": 46,
    "topScore": 105,
    "classAverage": 60,
    "subjects": [
      { "name": "Physics",     "myScore": 26, "classAverage": 14, "topScore": 29, "maxScore": 30 },
      { "name": "Chemistry",   "myScore": 24, "classAverage": 15, "topScore": 28, "maxScore": 30 },
      { "name": "Mathematics", "myScore": 24, "classAverage": 13, "topScore": 27, "maxScore": 30 },
      { "name": "Biology",     "myScore": 18, "classAverage": 18, "topScore": 27, "maxScore": 30 }
    ]
  },
  "message": "Quiz stats fetched successfully"
}
```

All scores are in **marks** as JSON numbers, not the stored `marks * 100` and not
strings. At most one decimal place (`72.5`), whole numbers without a decimal.

### `data`

| Field | Type | Meaning |
| --- | --- | --- |
| `quizId` | int | Echo of the request. |
| `attemptId` | int | The candidate's attempt that `myScore` and `subjects[].myScore` come from. |
| `title` | string | `quiz_config.title`. |
| `maxScore` | number | Total marks of the quiz: sum of `ms` over `quiz_config.questionsData` (the report's `scoreBase`). |
| `myScore` | number | The candidate's `finalScore / 100` for `attemptId`. |
| `myRank` | int ≥ 1 | `1 +` the number of candidates in the class whose score is higher than `myScore`. Ties share a rank (two toppers are both rank 1, the next is rank 3). |
| `classStrength` | int ≥ 1 | Number of **candidates** counted in the class (not attempts). Shown as "6 / 46" and "46 students". |
| `topScore` | number | Highest score in the class. Never lower than `myScore`. |
| `classAverage` | number | Mean score of the class, rounded to one decimal. |
| `subjects` | array | One entry per subject present in the quiz, in the quiz's subject order. May be a single entry for a one-subject quiz. |

### `data.subjects[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | string | Subject name. Unique within the list (used as the React key). |
| `myScore` | number | Marks the candidate scored on this subject's questions. The values add up to `data.myScore`. |
| `classAverage` | number | Mean of the class's marks on this subject, one decimal. The values add up to `data.classAverage` (give or take rounding). |
| `topScore` | number | Highest marks anyone in the class scored on this subject. Not shown yet; send it so the popup can add it without an API change. |
| `maxScore` | number | Total marks of this subject's questions. The values add up to `data.maxScore`. Bar widths are `score / maxScore`. |

The popup works out "32 above average" / "below average" itself from `myScore`
and `classAverage`; the API does not send it.

## Building it from `quiz_attempts`

**Who is "the class".** Every candidate with a completed, report-generated
attempt of the quiz: the same population `quiz-report.php` already uses for
`globalAverage`.

```sql
WHERE quizId = ? AND status = 2 AND endReason NOT IN (3) AND reportStatus = 1
```

It is not narrowed to the candidate's batch. If it should be, join
`candidate_batch_mapping` the way `user/attendance.php` does and keep only
candidates who share a batch with `$TOKEN_USER_ID`; nothing in the response
shape changes.

**One attempt per candidate.** A candidate with several attempts of the same
quiz counts once, by their latest attempt (`MAX(id)`), so re-attempts neither
inflate `classStrength` nor pull the average. The requesting candidate is the
one exception: when `attemptId` is sent, that attempt stands in for them.

Totals, in one query:

```sql
SELECT qa.candidateId, qa.id, qa.finalScore
FROM quiz_attempts qa
JOIN (
  SELECT candidateId, MAX(id) AS id
  FROM quiz_attempts
  WHERE quizId = ? AND status = 2 AND endReason NOT IN (3) AND reportStatus = 1
  GROUP BY candidateId
) latest ON latest.id = qa.id;
```

From those rows: `classStrength = count`, `topScore = max(finalScore) / 100`,
`classAverage = avg(finalScore) / 100`,
`myRank = 1 + count(finalScore > mine)`.

**Subjects.** A quiz has a single "General" section, so subjects come from the
question bank, not from `sectionWiseResponse`:

1. `quiz_config.questionsData` gives each question's id (`qi`) and marks (`ms`,
   default `1`).
2. `practice_question_bank.classificationLevel1` for those ids gives the
   subject; `getSubjectNameByNumber()` (as in
   `restricted/question-bank/read-single.php`) gives its name. Summing `ms` per
   subject gives `subjects[].maxScore`.
3. For each attempt from the query above, `generatedReport`
   → `sectionWiseResponse[].questions[]` has the awarded `marks` per question
   (`qi` there is the `questionDisplayKey`, so map display key → subject in
   step 2). Summing per subject gives that candidate's subject scores; the
   mean and max across candidates give `classAverage` and `topScore`.

Step 3 decodes one JSON report per candidate in the class. The figures only
change when someone finishes the quiz or a report is re-evaluated, so they can
be cached per `quizId` (everything except `myScore`, `myRank` and
`subjects[].myScore`) if this gets slow.

Use `date_default_timezone_set('Asia/Kolkata')` as in the sibling scripts.

## Errors

| Case | Response | Popup behaviour |
| --- | --- | --- |
| Missing / invalid token | HTTP `401` | Session is cleared and the candidate is sent to `/start?next=/performance`. |
| `quizId` missing or `≤ 0` | HTTP `400`, `{ "status": "error", "message": "Invalid quizId" }` | Error alert with the message. |
| The candidate has no completed attempt of this quiz (or `attemptId` is not theirs / not this quiz) | HTTP `404`, `"No completed attempt found"` | Error alert with the message. |
| The candidate's report is not generated yet (`reportStatus != 1`) | HTTP `404`, `"Report not generated yet"` | Error alert with the message. |
| The quiz has no `quiz_config` row | HTTP `404`, `"Quiz not found"` | Error alert with the message. |
| Anything else | `{ "status": "error", "message": "…" }` | Error alert with the message. |

A candidate can only see stats for a quiz they have completed; the popup is
only reachable from their own attempt rows.

## Wiring it into the portal

Once the endpoint is live, `getExamStats()` becomes:

```js
export async function getExamStats(report) {
  const query = `quizId=${encodeURIComponent(report.quizId)}&attemptId=${encodeURIComponent(report.attemptId)}`;
  return unwrap(await api.get(`/user/quiz/quiz-stats.php?${query}`));
}
```

`report` is the row from `quiz-summary.php`, which already has `quizId` and
`attemptId`. With no `sample: true` in the response the "Sample data" pill goes
away on its own. `demoExamStats` in `src/data/performanceDemo.js` can then be
deleted.

## Local mock

Not mocked yet. `scripts/mock-api.mjs` serves `quiz-summary.php` rows without a
`quizId`; add it there along with a `GET /user/quiz/quiz-stats.php` handler
when wiring the real call.
