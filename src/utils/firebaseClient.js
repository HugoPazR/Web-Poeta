// Firebase client wrapper (modular SDK). Supports Auth + Firestore.
// Usage: configure env vars in .env.local (see .env.local.example)

let initPromise = null;
let cachedAuth = null;
let cachedFirestore = null;

function hasConfig() {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);
}

// Returns { auth, firestore, helpers } once initialized, or null if unconfigured/failed.
// Concurrent callers share the same in-flight promise so initializeApp() only ever runs once.
async function init() {
  if (!hasConfig()) return null;
  if (!initPromise) {
    initPromise = (async () => {
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword, deleteUser } = await import('firebase/auth');
      const { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc, increment, query, where } = await import('firebase/firestore');

      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      const firebaseApp = initializeApp(config);
      cachedAuth = getAuth(firebaseApp);
      cachedFirestore = getFirestore(firebaseApp);

      console.debug('[firebaseClient] initialized', { projectId: config.projectId });

      return {
        auth: cachedAuth,
        firestore: cachedFirestore,
        helpers: { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword, deleteUser, doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc, increment, query, where },
      };
    })().catch((e) => {
      console.warn('Firebase init failed', e);
      initPromise = null; // allow a retry on the next call
      return null;
    });
  }
  return initPromise;
}

export async function isEnabled() {
  return Boolean(await init());
}

// --- Auth helpers -------------------------------------------------
export async function signUp(email, password, displayName) {
  const ctx = await init();
  if (!ctx) throw new Error('Firebase not configured');
  const { helpers } = ctx;
  const res = await helpers.createUserWithEmailAndPassword(ctx.auth, email, password);
  if (displayName && res.user) {
    try { await helpers.updateProfile(res.user, { displayName }); } catch { /* ignore */ }
  }
  return res.user;
}

export async function signIn(email, password) {
  const ctx = await init();
  if (!ctx) throw new Error('Firebase not configured');
  const { helpers } = ctx;
  const res = await helpers.signInWithEmailAndPassword(ctx.auth, email, password);
  return res.user;
}

export async function signOutUser() {
  const ctx = await init();
  if (!ctx) throw new Error('Firebase not configured');
  return ctx.helpers.signOut(ctx.auth);
}

export async function onAuthChanged(cb) {
  const ctx = await init();
  if (!ctx) return () => {};
  return ctx.helpers.onAuthStateChanged(ctx.auth, cb);
}

export function currentUser() {
  return cachedAuth ? cachedAuth.currentUser : null;
}

export async function updateDisplayName(displayName) {
  const ctx = await init();
  if (!ctx || !ctx.auth.currentUser) throw new Error('Firebase not configured or not signed in');
  await ctx.helpers.updateProfile(ctx.auth.currentUser, { displayName });
}

// Firebase requires a recent login for both of these; expect an `auth/requires-recent-login`
// error if the user's session is old, and ask them to sign in again.
export async function changePassword(newPassword) {
  const ctx = await init();
  if (!ctx || !ctx.auth.currentUser) throw new Error('Firebase not configured or not signed in');
  await ctx.helpers.updatePassword(ctx.auth.currentUser, newPassword);
}

export async function deleteAccount() {
  const ctx = await init();
  if (!ctx || !ctx.auth.currentUser) throw new Error('Firebase not configured or not signed in');
  await ctx.helpers.deleteUser(ctx.auth.currentUser);
}

// --- Firestore helpers --------------------------------------------
export async function setDocData(collectionName, docId, data) {
  const ctx = await init();
  if (!ctx) throw new Error('Firebase not configured');
  const { firestore, helpers } = ctx;
  try {
    await helpers.setDoc(helpers.doc(firestore, collectionName, String(docId)), data, { merge: true });
    console.debug('[firebaseClient] setDocData OK', collectionName, docId);
    return true;
  } catch (e) {
    console.error('[firebaseClient] setDocData failed', collectionName, docId, e);
    throw e;
  }
}

export async function getDocData(collectionName, docId) {
  const ctx = await init();
  if (!ctx) return null;
  const { firestore, helpers } = ctx;
  const snap = await helpers.getDoc(helpers.doc(firestore, collectionName, String(docId)));
  return snap.exists() ? snap.data() : null;
}

export async function addDocData(collectionName, data) {
  const ctx = await init();
  if (!ctx) return null;
  const { firestore, helpers } = ctx;
  try {
    const ref = await helpers.addDoc(helpers.collection(firestore, collectionName), data);
    console.debug('[firebaseClient] addDocData OK', collectionName, ref.id);
    return { id: ref.id };
  } catch (e) {
    console.error('[firebaseClient] addDocData failed', collectionName, e);
    return null;
  }
}

export async function getCollection(collectionName) {
  const ctx = await init();
  if (!ctx) return [];
  const { firestore, helpers } = ctx;
  const snaps = await helpers.getDocs(helpers.collection(firestore, collectionName));
  const out = [];
  snaps.forEach(s => out.push({ id: s.id, ...s.data() }));
  return out;
}

export async function getCollectionWhere(collectionName, field, value) {
  const ctx = await init();
  if (!ctx) return [];
  const { firestore, helpers } = ctx;
  const q = helpers.query(helpers.collection(firestore, collectionName), helpers.where(field, '==', value));
  const snaps = await helpers.getDocs(q);
  const out = [];
  snaps.forEach(s => out.push({ id: s.id, ...s.data() }));
  return out;
}

export async function deleteDocData(collectionName, docId) {
  const ctx = await init();
  if (!ctx) return false;
  const { firestore, helpers } = ctx;
  await helpers.deleteDoc(helpers.doc(firestore, collectionName, String(docId)));
  return true;
}

// Atomically increments one or more fields on a doc (creates it if missing).
// fieldDeltas: e.g. { views: 1 } or nested { counts: { '❤️': 1 } }
export async function incrementFields(collectionName, docId, fieldDeltas) {
  const ctx = await init();
  if (!ctx) throw new Error('Firebase not configured');
  const { firestore, helpers } = ctx;

  function applyIncrement(value) {
    if (typeof value === 'number') return helpers.increment(value);
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = applyIncrement(v);
      return out;
    }
    return value;
  }

  const data = applyIncrement(fieldDeltas);
  await helpers.setDoc(helpers.doc(firestore, collectionName, String(docId)), data, { merge: true });
  return true;
}

export default { init, isEnabled, signUp, signIn, signOutUser, onAuthChanged, currentUser, updateDisplayName, changePassword, deleteAccount, setDocData, getDocData, addDocData, getCollection, getCollectionWhere, deleteDocData, incrementFields };
