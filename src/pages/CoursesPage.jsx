import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Icon } from '../components/Icons';
import { Card } from '../components/ui';
import TileDropdown from '../components/TileDropdown';
import { useUser } from '../components/UserProvider';
import { useToast } from '../components/Toast';
import { getCourseBundleProgress } from '../lib/candidateApi';
import { getSearchParam, replaceSearchParam } from '../lib/browser';
import WatchHistory from '../components/WatchHistory';
import CatalogBanner from '../components/CatalogBanner';
import CatalogSeries from '../components/CatalogSeries';
import { getWatchHistory, playerCourseIds } from '../lib/watchHistory';

/**
 * Enrolled video courses (bundles): the open course shows as a cover with a
 * "Switch course" menu; below it, its modules and chapters; "Watch" opens the chapter in the course player.
 */
export default function CoursesPage() {
  const toast = useToast();
  const [bundles, setBundles] = useState(null); // null = loading
  const [bundlesFound, setBundlesFound] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [bundleContent, setBundleContent] = useState(null); // { modules, chapters }
  const [activeModule, setActiveModule] = useState(null);
  const [query, setQuery] = useState(''); // chapter search, across every module of the open course
  const [recent, setRecent] = useState([]); // last videos watched in the open course
  const [counts, setCounts] = useState({}); // course id -> { modules, chapters }
  const { profile } = useUser() || {};

  // The open module tab is kept in the URL: /courses?id=<course id>&module=<module id>
  const openModule = useCallback((modId) => {
    setQuery('');
    setActiveModule(modId);
    replaceSearchParam('module', modId);
  }, []);

  // `wantedModule` is the ?module= from the URL on first load; anything that is
  // not a module of this course falls back to the first module in the list.
  const selectCourseBundle = useCallback(async (bundle, wantedModule) => {
    setSelectedBundle(bundle);
    setBundleContent(null);
    setQuery('');
    replaceSearchParam('id', bundle.id);
    try {
      const data = await getCourseBundleProgress();
      const content = data.coursesMetadata?.[bundle.id];
      const modules = content?.modules || {};
      setBundleContent({ modules, chapters: content?.chapters || [] });
      const ids = Object.keys(modules);
      openModule(ids.find((m) => String(m) === String(wantedModule)) || ids[0] || null);
    } catch {
      toast('Error loading course bundle data');
    }
  }, [toast, openModule]);

  useEffect(() => {
    getCourseBundleProgress()
      .then((data) => {
        const list = data.enrolledCourses || [];
        setBundles(list);
        const all = {};
        Object.entries(data.coursesMetadata || {}).forEach(([id, c]) => {
          all[id] = { modules: Object.keys(c?.modules || {}).length, chapters: (c?.chapters || []).length };
        });
        setCounts(all);
        setBundlesFound(true);
        // Open the course named in ?id= when the candidate has it, else the first one.
        const wanted = getSearchParam('id');
        const initial = list.find((b) => String(b.id) === String(wanted)) || list[0];
        // ?module= only applies to the course it came with.
        if (initial) selectCourseBundle(initial, String(initial.id) === String(wanted) ? getSearchParam('module') : null);
      })
      .catch(() => { setBundles([]); setBundlesFound(false); });
  }, [selectCourseBundle]);

  // Last three videos watched in the open course; refreshed when the candidate
  // comes back from the player tab. With no history the section stays hidden.
  useEffect(() => {
    if (!bundleContent) { setRecent([]); return undefined; }
    let alive = true;
    const load = () => getWatchHistory(playerCourseIds(bundleContent.chapters), 3)
      .then((list) => { if (alive) setRecent(Array.isArray(list) ? list : []); })
      .catch(() => { if (alive) setRecent([]); });
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', load);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', load); };
  }, [bundleContent]);

  // Searching looks through every module of the course; otherwise the open tab.
  const needle = query.trim().toLowerCase();
  const searching = needle !== '';
  const chapters = !bundleContent ? [] : searching
    ? bundleContent.chapters.filter((c) => `chapter ${c.chapterNumber} ${c.title} ${bundleContent.modules[c.moduleId]?.name || ''}`.toLowerCase().includes(needle))
    : bundleContent.chapters.filter((c) => String(c.moduleId) === String(activeModule));

  // Access level and validity live on the profile's enrolled courses; match by title.
  const accessByTitle = useMemo(() => {
    const map = {};
    (profile?.courses || []).forEach((c) => { if (c?.title) map[c.title.trim().toLowerCase()] = c; });
    return map;
  }, [profile]);

  const courseItems = (bundles || []).map((bundle) => {
    const access = accessByTitle[(bundle.title || '').trim().toLowerCase()];
    const premium = access?.accessLevel === 'Premium';
    const badges = [];
    if (access?.accessLevel) badges.push({ label: `${access.accessLevel} access`, tone: premium ? 'sky' : 'ghost', icon: premium ? Icon.Crown : undefined });
    const validity = access ? (access.expiry && access.expiry !== 'Unknown' ? `Access till ${access.expiry}` : 'Unlimited access') : null;
    const c = counts[bundle.id];
    const size = c ? `${c.modules} ${c.modules === 1 ? 'module' : 'modules'} · ${c.chapters} ${c.chapters === 1 ? 'chapter' : 'chapters'}` : null;
    const stats = c ? [{ value: c.modules, label: c.modules === 1 ? 'Module' : 'Modules' }, { value: c.chapters, label: c.chapters === 1 ? 'Chapter' : 'Chapters' }] : [];
    return { id: bundle.id, title: bundle.title, image: bundle.photo || null, fallbackIcon: Icon.Book, badges, meta: [validity, size], coverMeta: [validity], stats };
  });

  return (
    <Layout title="Courses" hideTitle>
      <div className="cp-page">
        {/* Already enrolled: a slim reminder that there is more in the catalog. */}
        {bundles?.length > 0 && <CatalogBanner compact />}

        {/* Not enrolled anywhere: the full invitation to the catalog. */}
        {(bundlesFound === false || (bundlesFound && bundles.length === 0)) && <CatalogBanner />}

        {/* Test series from the catalog, under the banner. Only while there is no
            course to show; enrolled candidates go straight to their course. */}
        {bundles !== null && bundles.length === 0 && <CatalogSeries />}

        {bundles === null && <div className="cp-skeleton cp-cover-skeleton" aria-busy="true" />}

        {bundles?.length > 0 && (
          <TileDropdown
            variant="cover"
            label="Course"
            switchLabel="Switch course"
            items={courseItems}
            value={selectedBundle?.id}
            onChange={(id) => { const next = bundles.find((x) => x.id === id); if (next) selectCourseBundle(next); }}
          />
        )}


        {selectedBundle && bundleContent && recent.length > 0 && (
          <Card>
            <WatchHistory items={recent} moduleNames={Object.fromEntries(Object.entries(bundleContent.modules).map(([id, m]) => [id, m.name]))} />
          </Card>
        )}

        {selectedBundle && (
          <Card className="course-bundle-content-container">
            <div className="cp-card-head">
              <h2>Modules</h2>
              {bundleContent && (
                <label className="cp-search">
                  <Icon.Search width={16} height={16} />
                  <input type="search" placeholder="Search chapters" aria-label="Search chapters in this course" value={query} onChange={(e) => setQuery(e.target.value)} />
                  {searching && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><Icon.X width={14} height={14} /></button>}
                </label>
              )}
            </div>
            {!bundleContent && <div className="cp-skeleton" style={{ minHeight: 120 }} aria-busy="true" />}
            {bundleContent && (
              <>
                <div id="tab-container">
                  {Object.entries(bundleContent.modules).map(([modId, mod]) => (
                    <button key={modId} type="button" className={`tab ${!searching && modId === activeModule ? 'active' : ''}`} onClick={() => openModule(modId)}>
                      {mod.name}
                    </button>
                  ))}
                </div>
                <div id="tab-contents">
                  {searching && chapters.length > 0 && <p className="cp-search-note">{chapters.length} {chapters.length === 1 ? 'chapter matches' : 'chapters match'} "{query.trim()}" across all modules</p>}
                  {(activeModule || searching) && (chapters.length === 0 ? <p>{searching ? 'No chapters match your search.' : 'No chapters available.'}</p> : (
                    <div className="tab-content">
                      <table>
                        <tbody key={searching ? 'search' : activeModule}>
                          {/* Chapter numbers repeat within a module (Plus One / Plus Two), so the key
                              is the chapter id; the tbody is re-keyed per module for a clean swap. */}
                          {chapters.map((ch, i) => (
                            <tr key={ch.id ?? ch.chapterId ?? `${ch.moduleId}-${i}`} className={ch.url ? '' : 'disabled'}>
                              <td>
                                <small className="cp-chapter-no">Chapter {ch.chapterNumber}</small>
                                <strong className="cp-chapter-title">{ch.title}</strong>
                                {searching && <small className="cp-search-module">{bundleContent.modules[ch.moduleId]?.name}</small>}
                              </td>
                              <td>{ch.url && <button type="button" className="btn-view" onClick={() => window.open(ch.url, '_blank')}>Watch</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}
