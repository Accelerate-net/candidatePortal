import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile } from '../lib/candidateApi';
import { isAuthenticated } from '../lib/auth';

/**
 * Holds the logged-in candidate's profile (user-profile.php) so the shell can
 * show the name and photo on every page, and the profile page can edit it.
 */
const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

export default function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isAuthenticated()) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      setProfile(await getProfile());
    } catch (e) {
      setError(e?.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateProfile = useCallback((next) => {
    setProfile((current) => (typeof next === 'function' ? next(current) : next));
  }, []);

  const value = useMemo(() => ({ profile, loading, error, refresh, updateProfile }), [profile, loading, error, refresh, updateProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
