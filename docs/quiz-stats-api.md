# Quiz Stats API ("Stats" popup on `/performance`)

The **Stats** button on each row of "Quiz Scores" opens the "Class stats" popup
(`src/components/ExamStatsDialog.jsx`). The popup makes one call, keyed by
`quizId`, and renders everything from its response.

It is served by `CrisprTechApp/user/quiz/quiz-stats.php`, next to
`quiz-summary.php` and `quiz-report.php`.

## Request

```
GET {API_BASE}/user/quiz/quiz-stats.php?quizId=50007&attemptId=200527
Authorization: Bearer <crispriteUserToken>
```

- `API_BASE` is `https://crisprtech.app/crispr-apis` (or `VITE_API_BASE`).
- The candidate comes from the token (`$TOKEN_USER_ID`, as in the other
  `user/quiz/*.php` scripts).
- CORS: allow `Content-Type, Authorization`; methods `GET, OPTIONS`.

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `quizId` | int | yes | `quiz_config.id`. Every row of `quiz-summary.php` carries it as `quizId`. |
| `attemptId` | int | no | The candidate's own attempt to report as "my score". Defaults to their latest completed attempt of this quiz. |

## Response

Standard envelope. The popup reads `data` only when `status` is `"success"`.

```json
{
  "status": "success",
  "data": {
    "quizId": 50007,
    "attemptId": 200527,
    "title": "Weekly Test 7",
    "maxScore": 240,
    "myScore": 104,
    "myRank": 29,
    "classStrength": 70,
    "topScore": 191,
    "classAverage": 94.8,
    "subjects": [
      { "name": "Biology",     "myScore": 27, "classAverage": 27.7, "topScore": 55, "maxScore": 60 },
      { "name": "Chemistry",   "myScore": 19, "classAverage": 25,   "topScore": 51, "maxScore": 60 },
      { "name": "Mathematics", "myScore": 22, "classAverage": 17.5, "topScore": 44, "maxScore": 60 },
      { "name": "Physics",     "myScore": 36, "classAverage": 24.5, "topScore": 47, "maxScore": 60 }
    ]
  },
  "message": "Quiz stats fetched successfully"
}
```

All scores are in **marks** as JSON numbers, not the stored `marks * 100` and not
strings. The popup shows whole numbers as they are and rounds decimals to one
place.

### `data`

| Field | Type | Shown as |
| --- | --- | --- |
| `myRank` | int ≥ 1 | "My rank" tile: `29 / 70`. |
| `classStrength` | int ≥ 1 | Denominator of the rank tile and "70 students" under the class average. |
| `topScore` | number | "Top score" tile: `191 / 240`. |
| `maxScore` | number | Total marks of the quiz; the denominator of the score tiles. |
| `myScore` | number | "My score" tile, with "N above/below the class average" worked out against `classAverage`. When missing, the popup falls back to the `score` of the `quiz-summary.php` row it was opened from ("92 / 120"). |
| `classAverage` | number | "Class average" tile: `94.8 / 240`. |
| `subjects` | array | "Subject-wise: you vs class average" bars, in the order sent. Omitted or empty: the block is hidden. |
| `quizId`, `attemptId`, `title` | | Echoes; not shown. |

### `data.subjects[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | string | Subject name shown next to the bars. |
| `myScore` | number | The candidate's marks on this subject (brand-coloured bar). |
| `classAverage` | number | Mean marks of the class on this subject (amber bar). |
| `topScore` | number | Highest marks in the class; shown as "top 55" beside "out of 60". |
| `maxScore` | number | Total marks of this subject. Bar widths are `score / maxScore`. |

### Older shape

Some deployments still answer with class-level figures only:

```json
{ "topScore": 155, "maxScore": 160, "avgTotal": 100.69, "attemptedCount": 64,
  "avgSectionWise": [ { "section": 1, "label": "Biology", "score": 28 } ] }
```

The popup renders this too: an "Attempted" tile instead of the rank, `avgTotal`
as the class average, "my score" from the summary row, and one class-average bar
per section scaled against the highest section average.

## Errors

| Case | Response | Popup behaviour |
| --- | --- | --- |
| Missing / invalid token | HTTP `401` | Session is cleared and the candidate is sent to `/start?next=/performance`. |
| `quizId` missing or `≤ 0` | HTTP `400`, `{ "status": "error", "message": "Invalid quizId" }` | Error alert with the message. |
| No completed attempt / report not generated / quiz not found | HTTP `404` with a message | Error alert with the message. |
| Anything else | `{ "status": "error", "message": "…" }` | Error alert with the message. |

## Local mock

`scripts/mock-api.mjs` serves `GET /user/quiz/quiz-stats.php` with the sample
response above for every `quizId`.
