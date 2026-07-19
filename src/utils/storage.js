// Utility for persisting reactions, comments, poems, and views.
// Firestore is the source of truth for poems/comments/reactions/views (shared across visitors).
// localStorage is kept as an offline cache/fallback for when Firebase isn't configured or a request fails.
// Auth lives in Firebase Auth + the AuthContext (see src/context/AuthContext.jsx), not here.

import { slugify } from './slug';

const STORAGE_KEY_REACTIONS = 'letrasdepaz_reactions';
const STORAGE_KEY_COMMENTS = 'letrasdepaz_comments';
const STORAGE_KEY_POEMS = 'letrasdepaz_custom_poems';
const STORAGE_KEY_VIEWS = 'letrasdepaz_views';
const STORAGE_KEY_VIEWS_DAILY = 'letrasdepaz_views_daily';
const STORAGE_KEY_LAST_SEEN = 'letrasdepaz_last_seen';
const STORAGE_KEY_USER_REACTIONS = 'letrasdepaz_user_reactions';
const STORAGE_KEY_REACTION_LOG = 'letrasdepaz_reaction_log';
const STORAGE_KEY_REACTIONS_DAILY = 'letrasdepaz_reactions_daily';
const DEVICE_REACTIONS_KEY = '_device';

// YYYY-MM-DD in the visitor's local timezone.
function todayDateStr() {
  return new Date().toLocaleDateString('en-CA');
}

function safeGetItem(key, fallback) {
  try {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

// Lazily import firebaseClient and only use it when a project is actually configured.
let fbModulePromise = null;
async function getFirebase() {
  if (!fbModulePromise) fbModulePromise = import('./firebaseClient');
  try {
    const fb = await fbModulePromise;
    const enabled = await fb.isEnabled();
    return enabled ? fb : null;
  } catch {
    return null;
  }
}

// Last seen
export function getLastSeen() { return safeGetItem(STORAGE_KEY_LAST_SEEN, { comments: 0, reactions: 0 }); }
export function updateLastSeen(type) { const lastSeen = getLastSeen(); lastSeen[type] = Date.now(); safeSetItem(STORAGE_KEY_LAST_SEEN, lastSeen); }

// Reactions (aggregate counts are shared via Firestore; which emoji *you* picked stays local per browser/user)
export async function getReactions(poemId) {
  const fb = await getFirebase();
  if (fb) {
    try {
      const data = await fb.getDocData('reactions', poemId);
      const counts = (data && data.counts) || {};
      const all = safeGetItem(STORAGE_KEY_REACTIONS, {});
      all[poemId] = counts;
      safeSetItem(STORAGE_KEY_REACTIONS, all);
      return counts;
    } catch (e) {
      console.warn('getReactions: Firestore fetch failed, using local cache', e);
    }
  }
  const all = safeGetItem(STORAGE_KEY_REACTIONS, {});
  return all[poemId] || {};
}

// userId is the signed-in Firebase Auth uid, or undefined for anonymous visitors
// (whose pick is remembered per-device instead).
export function getUserReaction(poemId, userId) {
  const all = safeGetItem(STORAGE_KEY_USER_REACTIONS, {});
  if (all && typeof all[poemId] === 'string') { const migrated = { [DEVICE_REACTIONS_KEY]: { ...all } }; safeSetItem(STORAGE_KEY_USER_REACTIONS, migrated); return migrated[DEVICE_REACTIONS_KEY][poemId] || null; }
  if (userId) return (all[userId] && all[userId][poemId]) || null;
  return (all[DEVICE_REACTIONS_KEY] && all[DEVICE_REACTIONS_KEY][poemId]) || null;
}
export function setUserReaction(poemId, emoji, userId) {
  const all = safeGetItem(STORAGE_KEY_USER_REACTIONS, {});
  if (all && typeof all[poemId] === 'string') { const migrated = { [DEVICE_REACTIONS_KEY]: { ...all } }; Object.assign(all, migrated); }
  if (userId) { if (!all[userId]) all[userId] = {}; all[userId][poemId] = emoji; }
  else { if (!all[DEVICE_REACTIONS_KEY]) all[DEVICE_REACTIONS_KEY] = {}; all[DEVICE_REACTIONS_KEY][poemId] = emoji; }
  safeSetItem(STORAGE_KEY_USER_REACTIONS, all);
}

export async function getAllReactions() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const docs = await fb.getCollection('reactions');
      const out = {};
      for (const d of docs) out[d.poemId || d.id] = d.counts || {};
      safeSetItem(STORAGE_KEY_REACTIONS, out);
      return out;
    } catch (e) {
      console.warn('getAllReactions: Firestore fetch failed, using local cache', e);
    }
  }
  return safeGetItem(STORAGE_KEY_REACTIONS, {});
}

// Synchronous read of whatever reaction counts were cached on a previous visit.
export function getCachedReactions() {
  return safeGetItem(STORAGE_KEY_REACTIONS, {});
}

export async function getReactionLog() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const docs = await fb.getCollection('reaction_log');
      return docs.sort((a, b) => a.timestamp - b.timestamp);
    } catch (e) {
      console.warn('getReactionLog: Firestore fetch failed, using local cache', e);
    }
  }
  return safeGetItem(STORAGE_KEY_REACTION_LOG, []);
}

// Raw per-poem, per-day NET new-reaction records (unlike reaction_log, this only counts a
// reaction once per person per poem — switching an existing reaction to a different emoji
// doesn't add to it, since that doesn't change the net reaction total). Used to build
// admin stats that reflect the real counter instead of every click event.
export async function getReactionsDailyRaw() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const docs = await fb.getCollection('reactions_daily');
      safeSetItem(STORAGE_KEY_REACTIONS_DAILY, docs);
      return docs;
    } catch (e) {
      console.warn('getReactionsDailyRaw: Firestore fetch failed, using local cache', e);
    }
  }
  const cached = safeGetItem(STORAGE_KEY_REACTIONS_DAILY, []);
  return Array.isArray(cached) ? cached : [];
}

export async function addReaction(poemId, emoji, userId) {
  const currentReaction = getUserReaction(poemId, userId);
  if (currentReaction === emoji) return getReactions(poemId);

  const isNetNewReaction = !currentReaction;
  const deltas = { [emoji]: 1 };
  if (currentReaction) deltas[currentReaction] = -1;

  const fb = await getFirebase();
  if (fb) {
    try {
      await fb.incrementFields('reactions', poemId, { counts: deltas });
    } catch (e) {
      console.error('addReaction: Firestore update failed', e);
    }
    try {
      await fb.addDocData('reaction_log', { poemId, emoji, timestamp: Date.now() });
    } catch { /* non-critical */ }
    if (isNetNewReaction) {
      try {
        const date = todayDateStr();
        await fb.incrementFields('reactions_daily', `${poemId}_${date}`, { poemId, date, count: 1 });
      } catch { /* non-critical: only affects the "reactions over time" reconciliation */ }
    }
  }

  // local cache (used as fallback + immediate optimistic value if Firestore is unavailable)
  const all = safeGetItem(STORAGE_KEY_REACTIONS, {});
  if (!all[poemId]) all[poemId] = {};
  if (currentReaction && all[poemId][currentReaction] > 0) all[poemId][currentReaction]--;
  all[poemId][emoji] = (all[poemId][emoji] || 0) + 1;
  safeSetItem(STORAGE_KEY_REACTIONS, all);

  setUserReaction(poemId, emoji, userId);

  const log = safeGetItem(STORAGE_KEY_REACTION_LOG, []);
  log.push({ poemId, emoji, timestamp: Date.now() });
  if (log.length > 200) log.splice(0, log.length - 200);
  safeSetItem(STORAGE_KEY_REACTION_LOG, log);

  return fb ? getReactions(poemId) : all[poemId];
}

// Comments (shared via Firestore)
export async function getComments(poemId) {
  const fb = await getFirebase();
  if (fb) {
    try {
      const docs = await fb.getCollectionWhere('comments', 'poemId', poemId);
      const sorted = docs.sort((a, b) => b.timestamp - a.timestamp);
      const localAll = safeGetItem(STORAGE_KEY_COMMENTS, {});
      localAll[poemId] = sorted;
      safeSetItem(STORAGE_KEY_COMMENTS, localAll);
      return sorted;
    } catch (e) {
      console.warn('getComments: Firestore fetch failed, using local cache', e);
    }
  }
  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  return (all[poemId] || []).sort((a, b) => b.timestamp - a.timestamp);
}

export async function getAllComments() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const docs = await fb.getCollection('comments');
      return docs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.warn('getAllComments: Firestore fetch failed, using local cache', e);
    }
  }
  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  const flat = [];
  for (const [poemId, comments] of Object.entries(all)) {
    for (const c of comments) flat.push({ ...c, poemId });
  }
  return flat.sort((a, b) => b.timestamp - a.timestamp);
}

export async function addComment(poemId, { name, text }) {
  const comment = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    poemId,
    name: name?.trim() || 'Anónimo',
    text: text.trim(),
    timestamp: Date.now(),
  };

  const fb = await getFirebase();
  if (fb) {
    try {
      await fb.setDocData('comments', `${poemId}_${comment.id}`, comment);
    } catch (e) {
      console.error('addComment: Firestore save failed', e);
    }
  }

  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  if (!all[poemId]) all[poemId] = [];
  all[poemId].push(comment);
  safeSetItem(STORAGE_KEY_COMMENTS, all);

  return fb ? getComments(poemId) : getComments(poemId);
}

export async function deleteComment(poemId, commentId) {
  const fb = await getFirebase();
  if (fb) {
    try {
      await fb.deleteDocData('comments', `${poemId}_${commentId}`);
    } catch (e) {
      console.error('deleteComment: Firestore delete failed', e);
    }
  }
  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  if (all[poemId]) {
    all[poemId] = all[poemId].filter(c => c.id !== commentId);
    safeSetItem(STORAGE_KEY_COMMENTS, all);
  }
}

// Views (shared via Firestore, atomic increment)
export async function getViews(poemId) {
  const fb = await getFirebase();
  if (fb) {
    try {
      const data = await fb.getDocData('views', poemId);
      const views = (data && data.views) || 0;
      const all = safeGetItem(STORAGE_KEY_VIEWS, {});
      all[poemId] = views;
      safeSetItem(STORAGE_KEY_VIEWS, all);
      return views;
    } catch (e) {
      console.warn('getViews: Firestore fetch failed, using local cache', e);
    }
  }
  const all = safeGetItem(STORAGE_KEY_VIEWS, {});
  return all[poemId] || 0;
}

export async function getAllViews() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const docs = await fb.getCollection('views');
      const out = {};
      for (const d of docs) out[d.poemId || d.id] = d.views || 0;
      return out;
    } catch (e) {
      console.warn('getAllViews: Firestore fetch failed, using local cache', e);
    }
  }
  return safeGetItem(STORAGE_KEY_VIEWS, {});
}

// Raw per-poem, per-day view records since daily tracking shipped — each entry is
// { poemId, date: 'YYYY-MM-DD', views }. Days before this feature shipped have no data.
// Used to build both the "reads over time" totals and "most-read poems this month".
export async function getViewsDailyRaw() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const docs = await fb.getCollection('views_daily');
      safeSetItem(STORAGE_KEY_VIEWS_DAILY, docs);
      return docs;
    } catch (e) {
      console.warn('getViewsDailyRaw: Firestore fetch failed, using local cache', e);
    }
  }
  const cached = safeGetItem(STORAGE_KEY_VIEWS_DAILY, []);
  return Array.isArray(cached) ? cached : [];
}

export async function addView(poemId) {
  try {
    const key = `letrasdepaz_viewed_${poemId}`;
    const last = window.sessionStorage.getItem(key);
    const now = Date.now();
    const thresholdMs = 3000;
    if (last && now - Number(last) < thresholdMs) return getViews(poemId);
    window.sessionStorage.setItem(key, String(now));
  } catch { /* sessionStorage unavailable, continue anyway */ }

  const date = todayDateStr();

  const fb = await getFirebase();
  if (fb) {
    try {
      await fb.incrementFields('views', poemId, { views: 1 });
    } catch (e) {
      console.error('addView: Firestore update failed', e);
    }
    try {
      await fb.incrementFields('views_daily', `${poemId}_${date}`, { poemId, date, views: 1 });
    } catch { /* non-critical: only affects the "reads over time" chart */ }
  }

  const all = safeGetItem(STORAGE_KEY_VIEWS, {});
  all[poemId] = (all[poemId] || 0) + 1;
  safeSetItem(STORAGE_KEY_VIEWS, all);

  const dailyAll = safeGetItem(STORAGE_KEY_VIEWS_DAILY, {});
  dailyAll[date] = (dailyAll[date] || 0) + 1;
  safeSetItem(STORAGE_KEY_VIEWS_DAILY, dailyAll);

  return fb ? getViews(poemId) : all[poemId];
}

// Synchronous read of whatever poems were cached on a previous visit, so the UI can render
// them instantly instead of waiting on Firebase's init + first Firestore round-trip.
export function getCachedPoems() {
  return safeGetItem(STORAGE_KEY_POEMS, []);
}

// Custom poems (shared via Firestore)
export async function getCustomPoems() {
  const fb = await getFirebase();
  if (fb) {
    try {
      const poems = await fb.getCollection('poems');
      const normalized = poems.map(p => ({ ...p, isCustom: true }));
      safeSetItem(STORAGE_KEY_POEMS, normalized);
      return normalized;
    } catch (e) {
      console.warn('getCustomPoems: Firestore fetch failed, using local cache', e);
    }
  }
  return safeGetItem(STORAGE_KEY_POEMS, []);
}

export async function addCustomPoem({ title, body, excerpt }) {
  const trimmedTitle = title.trim();

  // Slugs power the poem's URL (e.g. /poema/soy-poeta). Older poems saved before this
  // feature don't have a stored slug, so their effective slug is computed on the fly —
  // include that here too, or a new poem's title could silently collide with one of theirs.
  const existingPoems = await getCustomPoems();
  const existingSlugs = new Set(existingPoems.map((p) => p.slug || slugify(p.title)));
  const baseSlug = slugify(trimmedTitle) || 'poema';
  let slug = baseSlug;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  const newPoem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    slug,
    title: trimmedTitle,
    body: body.trim(),
    excerpt: excerpt?.trim() || body.trim().split('\n')[0].slice(0, 80) + '...',
    date: new Date().toISOString().split('T')[0],
    // date only has day precision, so it can't order same-day poems — createdAt can.
    createdAt: Date.now(),
    isCustom: true,
  };

  const fb = await getFirebase();
  if (fb) {
    try {
      await fb.setDocData('poems', newPoem.id, newPoem);
    } catch (e) {
      console.error('addCustomPoem: Firestore save failed — this poem will only be visible on this device until it syncs', e);
    }
  }

  const poems = safeGetItem(STORAGE_KEY_POEMS, []);
  poems.push(newPoem);
  safeSetItem(STORAGE_KEY_POEMS, poems);
  return newPoem;
}

export async function deleteCustomPoem(poemId) {
  const fb = await getFirebase();
  if (fb) {
    try {
      await fb.deleteDocData('poems', poemId);
    } catch (e) {
      console.error('deleteCustomPoem: Firestore delete failed', e);
    }
  }
  const poems = safeGetItem(STORAGE_KEY_POEMS, []).filter(p => p.id !== poemId);
  safeSetItem(STORAGE_KEY_POEMS, poems);
  return poems;
}

// Helpers
export function getPoemTitle(poemId, allPoems) {
  const poem = allPoems.find((p) => p.id === poemId);
  return poem ? poem.title : 'Poema desconocido';
}

// The URL-facing identifier for a poem. Poems published before this feature shipped have
// no stored `slug` field, so it's derived from the title on the fly for those.
export function getPoemSlug(poem) {
  return poem.slug || slugify(poem.title);
}

// Sample poems and older custom poems only have day-precision `date`, so same-day poems
// need `createdAt` (ms precision) to break ties and sort newest-first correctly.
function getPoemSortKey(poem) {
  return poem.createdAt || new Date(poem.date).getTime();
}
export function sortPoemsByNewest(poems) {
  return [...poems].sort((a, b) => getPoemSortKey(b) - getPoemSortKey(a));
}

// Newsletter subscription. Doc id is the normalized email itself, so re-subscribing
// just updates the timestamp instead of creating duplicates.
export async function subscribeToNewsletter(email) {
  const normalized = email.trim().toLowerCase();
  const fb = await getFirebase();
  if (!fb) throw new Error('No se pudo conectar. Intenta de nuevo más tarde.');
  await fb.setDocData('subscribers', normalized, { email: normalized, createdAt: Date.now() });
}

// Admin-only (see firestore.rules): list/remove newsletter subscribers.
export async function getSubscribers() {
  const fb = await getFirebase();
  if (!fb) return [];
  try {
    const docs = await fb.getCollection('subscribers');
    return docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    console.warn('getSubscribers: Firestore fetch failed', e);
    return [];
  }
}

export async function deleteSubscriber(email) {
  const fb = await getFirebase();
  if (!fb) return;
  await fb.deleteDocData('subscribers', email);
}
