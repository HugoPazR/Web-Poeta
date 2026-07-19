import { createContext, useContext, useEffect, useState } from 'react';
import { isEnabled, onAuthChanged, getDocData } from '../utils/firebaseClient';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      const enabled = await isEnabled();
      if (!enabled) {
        if (!cancelled) setLoading(false);
        return;
      }

      unsubscribe = await onAuthChanged((firebaseUser) => {
        if (cancelled) return;

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // isAdmin now lives in Firestore (the `admins` collection) instead of a hardcoded
        // email, so it can't be known synchronously — unlike the old email check. Fetch it
        // together with the profile doc and reveal `user` only once, so `loading` stays true
        // until both resolve — a route guard that bails out early while loading never sees a
        // stale `isAdmin: false` and bounces a real admin back to /login.
        Promise.all([
          getDocData('admins', firebaseUser.uid).catch(() => null),
          getDocData('users', firebaseUser.uid).catch(() => null),
        ]).then(([adminDoc, profile]) => {
          if (cancelled) return;
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: profile?.name || firebaseUser.displayName || firebaseUser.email,
            isAdmin: Boolean(adminDoc),
            birthdate: profile?.birthdate || null,
            phone: profile?.phone || null,
            gender: profile?.gender || null,
            country: profile?.country || null,
          });
          setLoading(false);
        });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- conventional context+hook pairing
export function useAuth() {
  return useContext(AuthContext);
}
