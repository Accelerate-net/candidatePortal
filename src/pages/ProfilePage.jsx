import React, { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import Layout from '../components/Layout';
import { Icon } from '../components/Icons';
import { Avatar, Card, Pill } from '../components/ui';
import { useToast } from '../components/Toast';
import { useUser } from '../components/UserProvider';
import { getSearchParam, replaceSearchParam, setSearchParam } from '../lib/browser';
import { removeIdPhoto, updateProfile as saveProfileApi, uploadIdPhoto, uploadProfilePhoto } from '../lib/candidateApi';
import { PLACES, buildProfilePayload, isOfflineStudent } from '../lib/profile';

const STUDENT_PHOTO_WIDTH = 826;
const STUDENT_PHOTO_HEIGHT = 1062;

const TABS = [
  { id: 1, label: (name) => `About ${name || ''}`, icon: Icon.User },
  { id: 2, label: () => 'Courses Enrolled', icon: Icon.List },
  { id: 3, label: () => 'Edit Details', icon: Icon.Pencil },
  { id: 4, label: () => 'ID Card Photo', icon: Icon.Image, offlineOnly: true }, // classroom students only
];

function parentsNames(p = {}) {
  const mother = p.motherName || '';
  const father = p.fatherName || '';
  if (mother && father) return `${mother} & ${father}`;
  return mother || father || '';
}

function boardAndYear(p = {}) {
  const board = p.board || '';
  let year = parseInt(p.yearOfPassing, 10) || '';
  if (year < 1) year = '';
  if (board && year) return `${board} / ${year}`;
  return board || year || '';
}

// Convert HEIC/HEIF (iPhone photos) before reading; everything else as-is.
async function fileToDataUrl(file) {
  let blob = file;
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    const { default: heic2any } = await import('heic2any');
    blob = await heic2any({ blob: file, toType: 'image/jpeg' });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Modal with a file picker and Cropper.js. `crop` holds the cropper options
 * and `output` the getCroppedCanvas() options; onSave gets the data URL.
 */
function PhotoCropModal({ open, title, note, crop, output, mime, quality, onSave, onClose }) {
  const [src, setSrc] = useState('');
  const imgRef = useRef(null);
  const cropperRef = useRef(null);

  useEffect(() => {
    if (!open) { setSrc(''); cropperRef.current?.destroy(); cropperRef.current = null; }
  }, [open]);

  if (!open) return null;

  async function handleFile(e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    cropperRef.current?.destroy();
    cropperRef.current = null;
    setSrc(await fileToDataUrl(file));
  }

  function initCropper() {
    if (!imgRef.current) return;
    cropperRef.current?.destroy();
    cropperRef.current = new Cropper(imgRef.current, crop);
  }

  function handleSave() {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCroppedCanvas(output);
    const dataUrl = mime ? canvas.toDataURL(mime, quality) : canvas.toDataURL();
    cropperRef.current.destroy();
    cropperRef.current = null;
    onSave(dataUrl);
  }

  return (
    <div className="cp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-modal cp-modal-lg" role="dialog" aria-modal="true" aria-labelledby="cp-photo-title">
        <h2 id="cp-photo-title">{title}</h2>
        <div className="cp-crop-frame">
          {src && <img ref={imgRef} src={src} alt="" onLoad={initCropper} />}
        </div>
        <p style={{ marginTop: 14 }}>{note}</p>
        <div className="cp-modal-actions is-spread">
          <label className="cp-btn cp-btn-ghost cp-file-btn">
            <Icon.Image width={16} height={16} /> Select an Image
            <input type="file" accept="image/jpeg, image/png" onChange={handleFile} aria-label="Select an image" />
          </label>
          <span className="cp-grow" />
          <button type="button" className="cp-btn cp-btn-light" onClick={onClose}>Close</button>
          {src && <button type="button" className="cp-btn cp-btn-primary" onClick={handleSave}>Save</button>}
        </div>
      </div>
    </div>
  );
}

// dd-mm-yyyy text input with a native date picker beside it.
function DobInput({ value, onChange }) {
  const nativeRef = useRef(null);
  function fromNative(e) {
    const iso = e.target.value; // yyyy-mm-dd
    if (!iso) return;
    const [y, m, d] = iso.split('-');
    onChange(`${d}-${m}-${y}`);
  }
  return (
    <div className="cp-dob">
      <input type="text" className="cp-input" placeholder="dd-mm-yyyy" autoComplete="off" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="cp-icon-btn" aria-label="Pick a date" onClick={() => (nativeRef.current?.showPicker ? nativeRef.current.showPicker() : nativeRef.current?.click())}>
        <Icon.Calendar width={18} height={18} />
      </button>
      <input ref={nativeRef} type="date" className="cp-dob-native" tabIndex={-1} aria-hidden="true" onChange={fromNative} />
    </div>
  );
}

export default function ProfilePage() {
  const toast = useToast();
  const { profile, updateProfile } = useUser() || {};
  const p = profile || {};
  const [activeTab, setActiveTab] = useState(() => parseInt(getSearchParam('currentTab'), 10) || 1);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [idPhotoOpen, setIdPhotoOpen] = useState(false);

  // The ID-card photo is for offline (classroom) students: `offlineOnboarded`.
  const offline = isOfflineStudent(profile);
  const tabs = TABS.filter((t) => !t.offlineOnly || offline);
  useEffect(() => {
    if (profile && !offline && activeTab === 4) { setActiveTab(1); replaceSearchParam('currentTab', 1); }
  }, [profile, offline, activeTab]);

  function changeActiveTab(id) {
    setSearchParam('currentTab', id);
    setActiveTab(id);
  }

  const set = (key) => (value) => updateProfile?.((current) => ({ ...(current || {}), [key]: value }));
  const field = (key) => ({ value: p[key] ?? '', onChange: (e) => set(key)(e.target.value) });

  async function saveProfile() {
    const payload = buildProfilePayload(p);
    try {
      const res = await saveProfileApi(payload);
      toast(res.status === 'success' ? 'Profile has been updated' : 'Update failed');
    } catch {
      toast('Update failed');
    }
  }

  async function saveCandidatePhoto(dataUrl) {
    setPhotoOpen(false);
    try {
      const res = await uploadProfilePhoto(dataUrl);
      if (res.status === 'success') {
        set('photo')(res.data);
        toast('Profile photo has been updated');
      }
    } catch { /* silent, as before */ }
  }

  async function saveStudentPhoto(dataUrl) {
    try {
      const res = await uploadIdPhoto(dataUrl);
      if (res.status === 'success') {
        set('idPhoto')(`${res.data}?t=${Date.now()}`);
        toast('Student photo has been updated');
      } else {
        toast('Upload failed');
      }
    } catch {
      toast('Upload failed');
    }
    setIdPhotoOpen(false);
  }

  async function removeStudentPhoto() {
    if (!window.confirm('Remove the student photo?')) return;
    try {
      const res = await removeIdPhoto();
      if (res.status === 'success') {
        set('idPhoto')('');
        toast('Student photo has been removed');
      } else {
        toast('Remove failed');
      }
    } catch {
      toast('Remove failed');
    }
  }

  const select = (key, options) => (
    <span className="cp-select-wrap">
      <select className="cp-select" {...field(key)}>{options}</select>
      <Icon.ChevronDown width={16} height={16} />
    </span>
  );

  return (
    <Layout title="Profile" hideTitle>
      <PhotoCropModal
        open={photoOpen}
        title="Profile photo"
        note="Upload good quality image. Only JPG, PNG files are supported."
        crop={{ aspectRatio: 1, autoCropArea: 0.9, scalable: false }}
        output={{ width: 100, height: 100, fillColor: '#fff', imageSmoothingEnabled: false, imageSmoothingQuality: 'high' }}
        onSave={saveCandidatePhoto}
        onClose={() => setPhotoOpen(false)}
      />
      <PhotoCropModal
        open={idPhotoOpen}
        title="Student photo"
        note={<>Crop window is fixed to {STUDENT_PHOTO_WIDTH} &times; {STUDENT_PHOTO_HEIGHT} pixels. Only JPG, PNG files are supported.</>}
        crop={{ aspectRatio: STUDENT_PHOTO_WIDTH / STUDENT_PHOTO_HEIGHT, autoCropArea: 1, viewMode: 1, scalable: false }}
        output={{ width: STUDENT_PHOTO_WIDTH, height: STUDENT_PHOTO_HEIGHT, fillColor: '#fff', imageSmoothingEnabled: true, imageSmoothingQuality: 'high' }}
        mime="image/jpeg"
        quality={0.92}
        onSave={saveStudentPhoto}
        onClose={() => setIdPhotoOpen(false)}
      />

      <div className="cp-page">
        <div className="cp-grid cp-grid-profile">
          <div className="cp-profile-side">
            <Card className="cp-profile-card">
              <div className="photo-container" role="button" tabIndex={0} aria-label="Change photo" onClick={() => setPhotoOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter') setPhotoOpen(true); }}>
                <Avatar src={p.photo} size="xl" className="photo" pending={!profile} />
                <span className="overlay-text">Change Photo</span>
              </div>
              <div className="name">{p.name}</div>
              <div className="info">{p.aspiration && <Pill tone="sky">{p.aspiration}</Pill>}</div>
              <p className="joined">Joined on {p.joined}</p>

              <div className="cp-profile-nav" role="tablist">
                {tabs.map(({ id, label, icon: Ico }) => (
                  <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={`list-group-item ${activeTab === id ? 'active' : ''}`} onClick={() => changeActiveTab(id)}>
                    <Ico width={18} height={18} /> {label(p.name)}
                    {id === 2 && <span className="badge">{p.courses?.length || 0}</span>}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div>
            {activeTab === 1 && (
              <Card>
                <div className="cp-card-head"><h2>About {p.name}</h2></div>
                {p.about ? (
                  <figure className="cp-about-quote">
                    <span className="cp-about-quote-mark" aria-hidden="true">&ldquo;</span>
                    <blockquote><p>{p.about}</p></blockquote>
                    <figcaption>
                      <span className="cp-about-quote-rule" aria-hidden="true" />
                      <strong>{p.name}</strong>
                      {p.aspiration && <small>{p.aspiration}</small>}
                    </figcaption>
                  </figure>
                ) : <p className="cp-about-text" />}

                <div className="cp-about-section">
                  <h4>{p.gender === 'Female' ? <Icon.User width={16} height={16} /> : <Icon.User width={16} height={16} />}Personal Information</h4>
                  <dl className="cp-dl">
                    <div><dt>Full Name</dt><dd>{p.name}</dd></div>
                    <div><dt>Birthday</dt><dd>{p.dob}</dd></div>
                    <div><dt>Gender</dt><dd>{p.gender}</dd></div>
                    <div><dt>Place</dt><dd>{p.place}</dd></div>
                    <div><dt>Parents</dt><dd>{parentsNames(p)}</dd></div>
                  </dl>
                </div>

                <div className="cp-about-section">
                  <h4><Icon.Graduation width={16} height={16} />Educational Information</h4>
                  <dl className="cp-dl">
                    <div><dt>Aspiration</dt><dd>{p.aspiration}</dd></div>
                    <div><dt>Class of Study</dt><dd>{p.classOfStudy} {p.lastInstitution ? p.lastInstitution : ''}</dd></div>
                    <div><dt>Board &amp; Year of Passing Class 12</dt><dd>{boardAndYear(p)}</dd></div>
                  </dl>
                </div>

                <div className="cp-about-section">
                  <h4><Icon.Mail width={16} height={16} />Communication Details</h4>
                  <dl className="cp-dl">
                    <div><dt>Registered Number</dt><dd>{p.registeredMobile} <Icon.CheckCircle width={14} height={14} className="cp-verified" /></dd></div>
                    <div><dt>Phone</dt><dd>{p.communicationMobile}</dd></div>
                    <div><dt>Email</dt><dd>{p.email}</dd></div>
                  </dl>
                </div>
              </Card>
            )}

            {activeTab === 2 && (
              <Card>
                <div className="cp-card-head">
                  <h2>Courses Enrolled by {p.name}</h2>
                  <Pill tone="ghost">{p.courses?.length || 0} enrolled</Pill>
                </div>
                <div className="cp-table-wrap">
                  <table className="cp-table" style={{ minWidth: 520 }}>
                    <thead>
                      <tr><th>#</th><th>Course</th><th>Type</th><th>Access</th><th>Valid Till</th></tr>
                    </thead>
                    <tbody>
                      {(p.courses || []).map((course, i) => (
                        <tr key={i}>
                          <td className="cp-td-muted">{i + 1}</td>
                          <td>
                            {course.type === 'Test Series'
                              ? <a className="cp-course-link" href="/test-series"><strong>{course.title}</strong></a>
                              : <strong>{course.title}</strong>}
                            {course.metadata?.commencement && (
                              <small className="cp-course-schedule">{course.metadata.commencement} to {course.metadata.conclusion}</small>
                            )}
                          </td>
                          <td><Pill tone="ghost" size="sm">{course.type}</Pill></td>
                          <td>
                            <Pill tone={course.accessLevel === 'Premium' ? 'sky' : 'ghost'} size="sm" title={course.accessLevel === 'Premium' ? 'Paid Content' : ''}>
                              {course.accessLevel === 'Premium' && <Icon.Crown width={12} height={12} />} {course.accessLevel}
                            </Pill>
                          </td>
                          <td className="cp-td-muted">{course.expiry !== 'Unknown' ? `until ${course.expiry}` : 'Unlimited'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!p.courses || p.courses.length === 0) && <p className="cp-empty cp-foot-note">You are not enrolled in any course yet.</p>}
              </Card>
            )}

            {activeTab === 3 && (
              <Card>
                <div className="cp-card-head">
                  <div>
                    <h2>Edit Details</h2>
                    <p>Keep your details up to date so we can reach you about exams and results.</p>
                  </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                  <div className="cp-form-grid">
                    <label className="cp-field"><span>Name</span><input type="text" className="cp-input" placeholder="Full Name" {...field('name')} /></label>
                    <label className="cp-field"><span>Registered Mobile</span><input type="text" className="cp-input" value={p.registeredMobile || ''} disabled readOnly /></label>
                    <label className="cp-field">
                      <span>Place</span>
                      {select('place', (
                        <>
                          <option value="">Not Known</option>
                          {Object.entries(PLACES).map(([group, items]) => (
                            <optgroup key={group} label={group}>
                              {items.map((item) => (Array.isArray(item)
                                ? <option key={item[0]} value={item[0]}>{item[1]}</option>
                                : <option key={item} value={item}>{item}</option>))}
                            </optgroup>
                          ))}
                        </>
                      ))}
                    </label>
                    <label className="cp-field"><span>Date of Birth</span><DobInput value={p.dob} onChange={set('dob')} /></label>
                    <label className="cp-field">
                      <span>Gender</span>
                      {select('gender', <><option value="">Not Selected</option><option value="Male">Male</option><option value="Female">Female</option><option value="Trans Gender">Trans Gender</option></>)}
                    </label>
                    <label className="cp-field"><span>Father's Name</span><input type="text" className="cp-input" placeholder="Father's Name" {...field('fatherName')} /></label>
                    <label className="cp-field"><span>Mother's Name</span><input type="text" className="cp-input" placeholder="Mother's Name" {...field('motherName')} /></label>
                    <label className="cp-field">
                      <span>Class of Study</span>
                      {select('classOfStudy', <><option value="">None</option><option value="Class 11 Going">Class 11 Going</option><option value="Class 12 Going">Class 12 Going</option><option value="Repeater">Repeater</option></>)}
                    </label>
                    <label className="cp-field">
                      <span>Your Aspiration</span>
                      {select('aspiration', <><option value="">None</option><option value="Aspiring Engineer">Aspiring Engineer</option><option value="Aspiring Doctor">Aspiring Doctor</option><option value="Aspiring Scientist">Aspiring Scientist</option></>)}
                    </label>
                    <label className="cp-field"><span>Year of Passing Class 12</span><input type="text" className="cp-input" placeholder="Year of Passing Class 12" {...field('yearOfPassing')} /></label>
                    <label className="cp-field">
                      <span>Class 12 Board</span>
                      {select('board', <><option value="Kerala State Board">Kerala State Board</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="OTHER">Others</option></>)}
                    </label>
                    <label className="cp-field is-full"><span>Last Studied Institution</span><input type="text" className="cp-input" placeholder="Name of the School or Coaching Institution" {...field('lastInstitution')} /></label>
                    <label className="cp-field"><span>Phone for Communication</span><input type="text" className="cp-input" placeholder="WhatsApp number preferred" {...field('communicationMobile')} /></label>
                    <label className="cp-field"><span>Email for Communication</span><input type="text" className="cp-input" placeholder="Email Address" {...field('email')} /></label>
                    <label className="cp-field is-full"><span>Few words about you!</span><textarea className="cp-textarea" {...field('about')} /></label>
                  </div>
                  <div className="cp-form-actions">
                    <button type="submit" className="cp-btn cp-btn-primary"><Icon.Save width={16} height={16} /> Save Profile</button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 4 && offline && (
              <Card>
                <div className="cp-card-head">
                  <div>
                    <h2>Student Photo</h2>
                    <p>Upload a clear passport-style photo. It will be cropped to a <strong>826 &times; 1062 pixels</strong> window before saving.</p>
                  </div>
                </div>
                {p.idPhoto ? (
                  <div className="cp-photo-preview">
                    <img src={p.idPhoto} alt="Student" />
                    <div className="cp-photo-actions">
                      <button type="button" className="cp-btn cp-btn-primary" onClick={() => setIdPhotoOpen(true)}><Icon.Pencil width={16} height={16} /> Modify Photo</button>
                      <button type="button" className="cp-btn cp-btn-danger" onClick={removeStudentPhoto}><Icon.Trash width={16} height={16} /> Remove Photo</button>
                    </div>
                  </div>
                ) : (
                  <div className="cp-state">
                    <span className="cp-state-icon"><Icon.Image /></span>
                    <p>No student photo uploaded yet.</p>
                    <button type="button" className="cp-btn cp-btn-primary" onClick={() => setIdPhotoOpen(true)}><Icon.Upload width={16} height={16} /> Upload Student Photo</button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
