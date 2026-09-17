# Attendance API (`/attendance` page)

The `/attendance` page makes one call and renders everything from its response.
It is served by `CrisprTechApp/user/attendance.php`; this is the contract the
page (`src/pages/AttendancePage.jsx`, `getAttendance()` in
`src/lib/candidateApi.js`) is written against. The shape is the same as the
`attendance` object the parent portal already gets from `parent/student-360.php`.

## Request

```
GET {API_BASE}/user/attendance.php
Authorization: Bearer <crispriteUserToken>
```

- `API_BASE` is `https://crisprtech.app/crispr-apis` (or `VITE_API_BASE`).
- No query parameters and no body. The candidate comes from the token
  (`$TOKEN_USER_ID`, as in the other `user/*.php` scripts).
- CORS: allow `Content-Type, Authorization`; methods `GET, OPTIONS`.

## Response

Standard envelope. The page reads `data` only when `status` is `"success"`.

```json
{
  "status": "success",
  "data": {
    "percent": 19,
    "percentDelta": 19,
    "tracked": true,
    "months": [
      {
        "key": "2026-09",
        "label": "September 2026",
        "present": 5,
        "absent": 11,
        "total": 16,
        "percent": 31,
        "days": [
          { "date": "2026-09-01", "day": 1, "weekday": 2, "status": "present" },
          { "date": "2026-09-06", "day": 6, "weekday": 0, "status": "off" },
          { "date": "2026-09-07", "day": 7, "weekday": 1, "status": "absent" },
          { "date": "2026-09-19", "day": 19, "weekday": 6, "status": "upcoming" }
        ]
      }
    ]
  }
}
```

### `data`

| Field | Type | Meaning |
| --- | --- | --- |
| `percent` | int 0–100 | Attendance over the last 30 days (today and the 29 days before). `0` when no class days fall in the window. |
| `percentDelta` | int | `percent` minus the same figure for the 30 days before that. `0` when either window has no class days. Shown as an up / down trend. |
| `tracked` | bool | `false` when attendance is not recorded for this candidate. The page then shows "Attendance is not tracked for you yet" and ignores everything else. |
| `months` | array | One entry per month, **newest first**, from June of the academic year (`2026-06`) through the current month. `months[0]` must be the current month: the "This month" tile reads it. |

### `months[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `key` | string | `YYYY-MM`. Unique; used as the month picker value. |
| `label` | string | Display name, e.g. `September 2026`. |
| `present` | int | Days with status `present`. |
| `absent` | int | Days with status `absent`. |
| `total` | int | `present + absent` (class days counted so far). `0` shows "No classes". |
| `percent` | int 0–100 | `round(present / total * 100)`, `0` when `total` is `0`. |
| `days` | array | **Every** day of the month, in order from the 1st. The calendar pads the first row from `days[0].weekday`, so a missing or unordered day misplaces the grid. |

### `months[].days[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `date` | string | `YYYY-MM-DD`. Unique key; also used to work out the current streak. |
| `day` | int | Day of the month, 1–31. |
| `weekday` | int | `0` = Sunday … `6` = Saturday (PHP `date('w')`). |
| `status` | string | One of `present`, `absent`, `off`, `upcoming`. |

The page computes the "Since June" totals and the current streak itself from
`months[].days[]`; the API does not send them.

## Building it from `candidate_attendance_records`

A row `(candidateId, day, month, year)` means the candidate was **present** that
day (rows are written by `restricted/attendance/process.php`, one per day,
duplicates ignored). A row `(day, month, year)` in `candidate_attendance_holidays`
marks a holiday for everyone. There are no rows for absences, so the statuses
are derived in this order (the rules of `parent/student-360.php`, plus the
holiday check):

1. `date > today` → `upcoming`
2. Sunday (`weekday = 0`) → `off`
3. the date is in `candidate_attendance_holidays` → `off`
4. `date < classDaysFrom` → `off`
5. a row exists for the date in `candidate_attendance_records` → `present`
6. otherwise → `absent`

A holiday wins over a record: if a candidate was somehow marked present on a
holiday, the day still shows as `off` and is not counted in `present` / `total`.
The same rules apply to the 30-day `percent` and `percentDelta` windows, so
holidays never lower the percentage.

`classDaysFrom` is the day attendance starts counting for the candidate: the
earliest of the candidate's first record and their batch start date. Without it
every day before the candidate joined would count as absent.

`tracked` is `true` when the candidate has a row in
`candidate_attendance_mapping` or at least one record.

Present days for the whole range in one query:

```sql
SELECT day, month, year
FROM candidate_attendance_records
WHERE candidateId = ?
  AND (year > 2026 OR (year = 2026 AND month >= 5));  -- May onwards covers the 60-day window at the start of June
```

Holidays for the same range (not per candidate):

```sql
SELECT day, month, year
FROM candidate_attendance_holidays
WHERE year > 2026 OR (year = 2026 AND month >= 5);
```

Build both into sets keyed by `YYYY-MM-DD` (`sprintf('%04d-%02d-%02d', ...)`,
casting the columns to int) and look each calendar day up in them.

With the sample rows for candidate `1402` (2, 3, 6 July and 1–5 September 2026),
and today = 18 Sep 2026, `classDaysFrom` = 2 Jul 2026:

| Month | present | absent | total | percent |
| --- | --- | --- | --- | --- |
| 2026-09 | 5 | 11 | 16 | 31 |
| 2026-08 | 0 | 26 | 26 | 0 |
| 2026-07 | 3 | 23 | 26 | 12 |
| 2026-06 | 0 | 0 | 0 | 0 |

The one sample holiday, 13 Sep 2026, is a Sunday, so it is `off` either way and
these figures do not change. A weekday holiday, say 14 Sep, would turn that day
from `absent` to `off` and September would become 5 / 15 = 33%.

The last 30 days (20 Aug – 18 Sep) give `percent` = 19; the 30 days before give
0, so `percentDelta` = 19. The JSON example above uses these figures (its `days`
list is shortened; the real one has all 30 days).

Notes:

- Holidays are global: `candidate_attendance_holidays` has no batch or centre
  column, so a holiday applies to every candidate. A class day missing from that
  table comes out as `absent` for anyone without a record.
- The page has one `off` status for Sundays, holidays and days before the
  candidate joined; the legend reads "Holiday / off". The API does not need to
  say which it was.
- The table has no unique key in the dump above. `process.php` relies on
  `INSERT IGNORE`, which only de-duplicates with
  `UNIQUE (candidateId, year, month, day)`; that key also serves this query.
- Use `date_default_timezone_set('Asia/Kolkata')` so "today" and the month
  boundaries match the class day.

## Errors

| Case | Response | Page behaviour |
| --- | --- | --- |
| Missing / invalid token | HTTP `401` | Session is cleared and the candidate is sent to `/start?next=/attendance`. |
| Anything else | `{ "status": "error", "message": "…" }` | "Couldn't load attendance" card with the message and a retry button. |
| Candidate not tracked | `success` with `"tracked": false, "months": []` | "Attendance is not tracked for you yet" card. |

## Local mock

`scripts/mock-api.mjs` serves `GET /user/attendance.php` with generated data in
this shape (Sundays off, classes from 15 Jun 2026).
