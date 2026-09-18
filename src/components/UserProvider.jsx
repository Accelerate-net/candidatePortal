import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile } from '../lib/candidateApi';
import { isAuthenticated } from '../lib/auth';
import { isCachedProfileFresh, readCachedProfile, writeCachedProfile } from '../lib/profileCache';

/**
 * Holds the logged-in candidate's profile (user-profile.php) so the shell can
 * show the name and photo on every page, and the profile page can edit it.
 * The provider mounts afresh on every route, so it starts from the session
 * cache (name and photo show at once) and refreshes quietly behind it.
 */
const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

export default function UserProvider({ children }) {
  const [profile, setProfile] = useState(readCachedProfile);
  const [loading, setLoading] = useState(() => !readCachedProfile());
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isAuthenticated()) { setLoading(false); return; }
    if (!readCachedProfile()) setLoading(true);
    setError('');
    try {
      const fresh = await getProfile();
      writeCachedProfile(fresh);
      setProfile(fresh);
    } catch (e) {
      setError(e?.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  // A recent cached copy is trusted as is; edits on the profile page update it.
  useEffect(() => { if (!isCachedProfileFresh()) refresh(); }, [refresh]);

  const updateProfile = useCallback((next) => {
    setProfile((current) => {
      const value = typeof next === 'function' ? next(current) : next;
      writeCachedProfile(value);
      return value;
    });
  }, []);

  const value = useMemo(() => ({ profile, loading, error, refresh, updateProfile }), [profile, loading, error, refresh, updateProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
