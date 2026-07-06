import { createContext, useContext, useEffect, useState } from 'react';
import { isEnabled, onAuthChanged, getDocData } from '../utils/firebaseClient';
import { ADMIN_EMAIL } from '../utils/constants';

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

        // Set everything Firebase Auth already knows immediately — isAdmin must never wait
        // on a network round-trip, or route guards that check it right after login/navigate
        // can fire while it's still stale and bounce the user back out.
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          isAdmin: firebaseUser.email === ADMIN_EMAIL,
          birthdate: null,
          phone: null,
          gender: null,
          country: null,
        });
        setLoading(false);

        // Merge in the Firestore profile once it arrives (display name override, extra fields).
        getDocData('users', firebaseUser.uid)
          .then((profile) => {
            if (cancelled || !profile) return;
            setUser((prev) => (prev && prev.uid === firebaseUser.uid ? {
              ...prev,
              name: profile.name || prev.name,
              birthdate: profile.birthdate || null,
              phone: profile.phone || null,
              gender: profile.gender || null,
              country: profile.country || null,
            } : prev));
          })
          .catch(() => { /* fall back to Firebase Auth fields only */ });
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
