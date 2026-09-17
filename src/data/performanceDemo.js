// Placeholder rows for "My Performance" when the progress-reports API cannot be
// reached. They are flagged `sample: true`, and the UI shows a "Sample data"
// pill so they are never mistaken for a real result.

export const demoProgressReports = [
  { id: 'demo-3', title: 'Progress Report July - September', issuedOn: '2026-09-07', fileType: 'pdf', url: null, sample: true },
  { id: 'demo-2', title: 'Progress Report April - June', issuedOn: '2026-06-30', fileType: 'pdf', url: null, sample: true },
  { id: 'demo-1', title: 'Progress Report January - March', issuedOn: '2026-03-31', fileType: 'pdf', url: null, sample: true },
];
