import React from 'react';

// Tiny inline icon set (stroke icons, currentColor) so the portal has no icon
// font dependency — keeps first paint fast on mobile data.
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

export const Icon = {
  Grid: (p) => (
    <svg {...base} {...p}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></svg>
  ),
  User: (p) => (
    <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  ),
  Logout: (p) => (
    <svg {...base} {...p}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M14 8l4 4-4 4" /><path d="M18 12H9" /></svg>
  ),
  ChevronDown: (p) => (<svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>),
  ChevronLeft: (p) => (<svg {...base} {...p}><path d="m15 6-6 6 6 6" /></svg>),
  ChevronRight: (p) => (<svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>),
  Check: (p) => (<svg {...base} {...p}><path d="m5 12 5 5L20 7" /></svg>),
  CheckCircle: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 5-5" /></svg>),
  X: (p) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  ArrowUp: (p) => (<svg {...base} {...p}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></svg>),
  ArrowDown: (p) => (<svg {...base} {...p}><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></svg>),
  TrendUp: (p) => (<svg {...base} {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>),
  TrendDown: (p) => (<svg {...base} {...p}><path d="M3 7l6 6 4-4 8 8" /><path d="M14 17h7v-7" /></svg>),
  Flash: (p) => (<svg {...base} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>),
  BarChart: (p) => (<svg {...base} {...p}><path d="M4 20h16" /><rect x="6" y="10" width="3" height="7" rx="1" /><rect x="11" y="5" width="3" height="12" rx="1" /><rect x="16" y="13" width="3" height="4" rx="1" /></svg>),
  Star: (p) => (<svg {...base} {...p}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" /></svg>),
  Desktop: (p) => (<svg {...base} {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>),
  Search: (p) => (<svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>),
  Book: (p) => (<svg {...base} {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5V5.5" /><path d="M8 7h8M8 11h6" /></svg>),
  Play: (p) => (<svg {...base} {...p}><path d="M7 4v16l13-8z" /></svg>),
  PlayCircle: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l5.5-3.5z" /></svg>),
  Clock: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  List: (p) => (<svg {...base} {...p}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h1M4 12h1M4 18h1" /></svg>),
  Crown: (p) => (<svg {...base} {...p}><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" /></svg>),
  Lock: (p) => (<svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>),
  Trash: (p) => (<svg {...base} {...p}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>),
  Upload: (p) => (<svg {...base} {...p}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></svg>),
  Pencil: (p) => (<svg {...base} {...p}><path d="M4 20h4l10-10-4-4L4 16z" /><path d="m13 7 4 4" /></svg>),
  Image: (p) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" /></svg>),
  Menu: (p) => (<svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>),
  Globe: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>),
  Medal: (p) => (<svg {...base} {...p}><circle cx="12" cy="14" r="5" /><path d="m8.5 10 -3-7h4l2.5 5M15.5 10l3-7h-4l-2.5 5" /></svg>),
  Sad: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M9 10h.01M15 10h.01" /><path d="M8.5 16a4 4 0 0 1 7 0" /></svg>),
  Graduation: (p) => (<svg {...base} {...p}><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /><path d="M22 9v6" /></svg>),
  Mail: (p) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 8 9 6 9-6" /></svg>),
  Calendar: (p) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>),
  Save: (p) => (<svg {...base} {...p}><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v6h8V3" /><path d="M8 21v-6h8v6" /></svg>),
  Info: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>),
  FileText: (p) => (<svg {...base} {...p}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M9.5 13h5M9.5 17h5" /></svg>),
  Bolt: (p) => (<svg {...base} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>),
  Shield: (p) => (<svg {...base} {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>),
  DoubleRight: (p) => (<svg {...base} {...p}><path d="m6 6 6 6-6 6M13 6l6 6-6 6" /></svg>),
};
