// Profile helpers shared by the profile page and the completion popup.

export const PLACES = {
  Kerala: ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
  'Rest of India': [['Lakshadweep', 'Lakshadweep'], ['Rest Of India', 'Rest of India']],
  'Rest of the World': ['Bahrain', 'Kuwait', 'Oman', 'Qatar', 'Saudi Arabia', 'United Arab Emirates'],
  Others: ['Others'],
};

// New accounts are created with this placeholder name.
const PLACEHOLDER_NAME = 'crisprite';

const blank = (v) => !v || String(v).trim() === '';

export function isNameMissing(profile) {
  const name = String(profile?.name ?? '').trim();
  return name === '' || name.toLowerCase() === PLACEHOLDER_NAME;
}

export function isValidName(name) {
  const n = String(name ?? '').trim();
  return n.length >= 2 && n.toLowerCase() !== PLACEHOLDER_NAME;
}

export function missingProfileFields(profile) {
  const missing = [];
  if (isNameMissing(profile)) missing.push('name');
  if (blank(profile?.email)) missing.push('email');
  if (blank(profile?.place)) missing.push('place');
  return missing;
}

// update-profile.php overwrites every column with what it receives (blank when
// a key is absent), so every save must carry the complete profile.
export function buildProfilePayload(p = {}) {
  let yearOfPassing = parseInt(p.yearOfPassing, 10);
  if (Number.isNaN(yearOfPassing) || yearOfPassing < 2000 || yearOfPassing > 2030) yearOfPassing = '';
  return {
    name: p.name,
    about: p.about,
    dob: p.dob,
    gender: p.gender,
    place: p.place,
    fatherName: p.fatherName,
    motherName: p.motherName,
    aspiration: p.aspiration,
    classOfStudy: p.classOfStudy,
    board: p.board,
    yearOfPassing,
    lastInstitution: p.lastInstitution,
    communicationMobile: p.communicationMobile,
    email: p.email,
  };
}

// My Performance needs something to report on: any course or test series.
export function hasAnyEnrolment(profile) {
  return (profile?.courses || []).length > 0;
}

// Quizzes and attendance belong to classroom/video courses. A candidate with no
// enrolment, or with test series only, does not get them.
export function hasCourseEnrolment(profile) {
  return (profile?.courses || []).some((c) => c?.type && c.type !== 'Test Series');
}

// Offline (classroom) students carry `offlineOnboarded: true`; they are the only
// ones who need an ID-card photo. Missing means false.
export function isOfflineStudent(profile) {
  const v = profile?.offlineOnboarded;
  return v === true || v === 1 || v === '1' || v === 'true';
}
