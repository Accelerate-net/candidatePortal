# Quiz Stats API ("Stats" popup on `/performance`)

The **Stats** button on each row of "Quiz Scores" opens the "Class stats" popup
(`src/components/ExamStatsDialog.jsx`). The popup makes one call, keyed by
`quizId`, and renders everything from its response. "My score" is not part of
the response: the popup takes it from the `score` of the `quiz-summary.php` row
it was opened from ("92 / 120").

It is served by `CrisprTechApp/user/quiz/quiz-stats.php`, next to
`quiz-summary.php` and `quiz-report.php`.

## Request

```
GET {API_BASE}/user/quiz/quiz-stats.php?quizId=5&attemptId=13
Authorization: Bearer <crispriteUserToken>
```

- `API_BASE` is `https://crisprtech.app/crispr-apis` (or `VITE_API_BASE`).
- The candidate comes from the token (`$TOKEN_USER_ID`, as in the other
  `user/quiz/*.php` scripts).
- CORS: allow `Content-Type, Authorization`; methods `GET, OPTIONS`.

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `quizId` | int | yes | `quiz_config.id`. Every row of `quiz-summary.php` carries it as `quizId`. |
| `attemptId` | int | no | The candidate's own attempt, sent when the row has one. Not used by the current response. |

## Response

Standard envelope. The popup reads `data` only when `status` is `"success"`.

```json
{
  "status": "success",
  "data": {
    "topScore": 155,
    "maxScore": 160,
    "avgTotal": 100.69,
    "attemptedCount": 64,
    "avgSectionWise": [
      { "section": 1, "label": "Biology",     "score": 28 },
      { "section": 2, "label": "Chemistry",   "score": 28 },
      { "section": 3, "label": "Mathematics", "score": 31 },
      { "section": 4, "label": "Physics",     "score": 16 }
    ]
  },
  "message": "Quiz stats fetched successfully"
}
```

All scores are in **marks** as JSON numbers, not the stored `marks * 100` and not
strings. The popup shows whole numbers as they are and rounds decimals to one
place (`100.69` → `100.7`).

### `data`

| Field | Type | Shown as |
| --- | --- | --- |
| `topScore` | number | "Top score" tile: `155 / 160`. |
| `maxScore` | number | Total marks of the quiz; the denominator of every tile. |
| `avgTotal` | number | "Class average" tile: `100.7 / 160`, with its percentage of `maxScore`. Also the reference for the "N above/below the class average" note on the "My score" tile. |
| `attemptedCount` | int | "Attempted" tile: number of students who took the quiz. |
| `avgSectionWise` | array | "Section-wise class average" bars, in the order sent. Omitted or empty: the section block is hidden. |

### `data.avgSectionWise[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `section` | int | Section number (React key). |
| `label` | string | Section name shown next to the bar. Falls back to `Section <n>`. |
| `score` | number | Mean marks of the class on that section. Bars are scaled against the highest section average, since the response carries no per-section maximum. |

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
