// Placeholder data for parts of "My Performance" whose APIs are not ready yet.
// Everything returned from here is flagged `sample: true`, and the UI shows a
// "Sample data" pill so it is never mistaken for a real result.
//
// Replace by wiring the real endpoints in src/lib/candidateApi.js:
//   getExamStats(attemptId)  -> class statistics for one weekly-exam attempt
//   getProgressReports()     -> PDFs issued by the centre

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

// Deterministic pseudo-random in [0, 1) so a given attempt always shows the same numbers.
function seeded(seed, salt) {
  const x = Math.sin((Number(seed) || 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// `report` is the row from the weekly-exam scores table ({ attemptId, title, score: "84 / 120", accuracy }).
export function demoExamStats(report = {}) {
  const seed = report.attemptId ?? 1;
  const [scoreText, maxText] = String(report.score ?? '').split('/').map((t) => parseInt(t, 10));
  const maxScore = Number.isFinite(maxText) ? maxText : 120;
  const myScore = Number.isFinite(scoreText) ? scoreText : Math.round(maxScore * 0.65);
  const classStrength = 38 + Math.floor(seeded(seed, 1) * 20);
  const classAverage = Math.round(maxScore * (0.48 + seeded(seed, 2) * 0.12));
  const topScore = Math.min(maxScore, Math.max(myScore, Math.round(maxScore * (0.86 + seeded(seed, 3) * 0.1))));
  const ahead = Math.max(0, Math.min(1, (topScore - myScore) / Math.max(1, topScore - classAverage * 0.6)));
  const myRank = Math.max(1, Math.round(1 + ahead * (classStrength - 1) * 0.6));

  const perSubjectMax = Math.round(maxScore / SUBJECTS.length);
  let remaining = myScore;
  const subjects = SUBJECTS.map((name, i) => {
    const share = i === SUBJECTS.length - 1 ? remaining : Math.min(perSubjectMax, Math.round((myScore / SUBJECTS.length) * (0.8 + seeded(seed, 10 + i) * 0.4)));
    remaining -= share;
    return {
      name,
      myScore: Math.max(0, Math.min(perSubjectMax, share)),
      classAverage: Math.round(perSubjectMax * (0.42 + seeded(seed, 20 + i) * 0.2)),
      topScore: Math.round(perSubjectMax * (0.85 + seeded(seed, 30 + i) * 0.15)),
      maxScore: perSubjectMax,
    };
  });

  return { sample: true, attemptId: report.attemptId, title: report.title, myScore, maxScore, topScore, classAverage, myRank, classStrength, subjects };
}

export const demoProgressReports = [
  { id: 'demo-3', title: 'Progress Report July - September', issuedOn: '2026-09-07', fileType: 'pdf', url: null, sample: true },
  { id: 'demo-2', title: 'Progress Report April - June', issuedOn: '2026-06-30', fileType: 'pdf', url: null, sample: true },
  { id: 'demo-1', title: 'Progress Report January - March', issuedOn: '2026-03-31', fileType: 'pdf', url: null, sample: true },
];
