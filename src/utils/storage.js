/**
 * Utility for persisting reactions, comments, views, and auth using localStorage.
 * Uses a 'shared: true' pattern so data persists across sessions.
 */

const STORAGE_KEY_REACTIONS = 'letrasdepaz_reactions';
const STORAGE_KEY_COMMENTS = 'letrasdepaz_comments';
const STORAGE_KEY_POEMS = 'letrasdepaz_custom_poems';
const STORAGE_KEY_VIEWS = 'letrasdepaz_views';
const STORAGE_KEY_AUTH = 'letrasdepaz_auth';
const STORAGE_KEY_LAST_SEEN = 'letrasdepaz_last_seen';
const STORAGE_KEY_USER_REACTIONS = 'letrasdepaz_user_reactions';
const DEVICE_REACTIONS_KEY = '_device';
const STORAGE_KEY_USERS = 'letrasdepaz_users';

// The admin password — change this to your own
const ADMIN_PASSWORD = 'poeta2026';

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

// Migrate any reactions stored under the anonymous/device bucket into a user's bucket
function migrateDeviceReactionsToUser(user) {
  if (!user || !user.id) return;
  const all = safeGetItem(STORAGE_KEY_USER_REACTIONS, {});
  const device = all[DEVICE_REACTIONS_KEY] || {};
  if (!device || Object.keys(device).length === 0) return;
  if (!all[user.id]) all[user.id] = {};
  for (const [poemId, emoji] of Object.entries(device)) {
    if (!all[user.id][poemId]) {
      all[user.id][poemId] = emoji;
    }
  }
  delete all[DEVICE_REACTIONS_KEY];
  safeSetItem(STORAGE_KEY_USER_REACTIONS, all);
}

// ─── Auth ─────────────────────────────────────────────────────────

export function registerUser(name, email, password) {
  const users = safeGetItem(STORAGE_KEY_USERS, []);
  if (users.find(u => u.email === email.trim().toLowerCase())) {
    return { success: false, error: 'El correo ya está registrado.' };
  }
  const newUser = {
    id: Date.now().toString(36),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'user'
  };
  users.push(newUser);
  safeSetItem(STORAGE_KEY_USERS, users);
  
  safeSetItem(STORAGE_KEY_AUTH, { loggedIn: true, user: newUser, timestamp: Date.now() });
  migrateDeviceReactionsToUser(newUser);
  return { success: true };
}

export function login(emailOrPassword, maybePassword) {
  let email = '';
  let password = '';
  
  if (arguments.length === 1) {
    if (emailOrPassword === ADMIN_PASSWORD) {
        const adminUser = { id: 'admin', name: 'El Poeta', email: 'poeta@letrasdepaz.com', role: 'admin' };
        safeSetItem(STORAGE_KEY_AUTH, { loggedIn: true, user: adminUser, timestamp: Date.now() });
        migrateDeviceReactionsToUser(adminUser);
        return { success: true, user: adminUser };
    }
    return { success: false, error: 'Credenciales inválidas' };
  } else {
    email = emailOrPassword.trim().toLowerCase();
    password = maybePassword;
    
    if (email === 'poeta@letrasdepaz.com' && password === ADMIN_PASSWORD) {
        const adminUser = { id: 'admin', name: 'El Poeta', email: 'poeta@letrasdepaz.com', role: 'admin' };
      safeSetItem(STORAGE_KEY_AUTH, { loggedIn: true, user: adminUser, timestamp: Date.now() });
      migrateDeviceReactionsToUser(adminUser);
      return { success: true, user: adminUser };
    }
    
    const users = safeGetItem(STORAGE_KEY_USERS, []);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      safeSetItem(STORAGE_KEY_AUTH, { loggedIn: true, user, timestamp: Date.now() });
      migrateDeviceReactionsToUser(user);
      return { success: true, user };
    }
    return { success: false, error: 'Correo o contraseña incorrectos' };
  }
}

export function logout() {
  safeSetItem(STORAGE_KEY_AUTH, { loggedIn: false, user: null });
}

export function isLoggedIn() {
  const auth = safeGetItem(STORAGE_KEY_AUTH, { loggedIn: false });
  return auth.loggedIn === true;
}

export function getCurrentUser() {
  const auth = safeGetItem(STORAGE_KEY_AUTH, { loggedIn: false });
  if (auth.loggedIn && auth.user) {
    return auth.user;
  }
  return null;
}

// ─── Last Seen (for "new" badges) ─────────────────────────────────

export function getLastSeen() {
  return safeGetItem(STORAGE_KEY_LAST_SEEN, {
    comments: 0,
    reactions: 0,
  });
}

export function updateLastSeen(type) {
  const lastSeen = getLastSeen();
  lastSeen[type] = Date.now();
  safeSetItem(STORAGE_KEY_LAST_SEEN, lastSeen);
}

// ─── Reactions ────────────────────────────────────────────────────

export function getReactions(poemId) {
  const all = safeGetItem(STORAGE_KEY_REACTIONS, {});
  return all[poemId] || {};
}

export function getUserReaction(poemId) {
  const all = safeGetItem(STORAGE_KEY_USER_REACTIONS, {});

  // Legacy format: root was a mapping poemId -> emoji (device-level)
  if (all && typeof all[poemId] === 'string') {
    // migrate into device bucket
    const migrated = { [DEVICE_REACTIONS_KEY]: { ...all } };
    safeSetItem(STORAGE_KEY_USER_REACTIONS, migrated);
    return migrated[DEVICE_REACTIONS_KEY][poemId] || null;
  }

  const user = getCurrentUser();
  if (user && user.id) {
    return (all[user.id] && all[user.id][poemId]) || null;
  }
  return (all[DEVICE_REACTIONS_KEY] && all[DEVICE_REACTIONS_KEY][poemId]) || null;
}

export function setUserReaction(poemId, emoji) {
  const all = safeGetItem(STORAGE_KEY_USER_REACTIONS, {});

  // If storage is in legacy shape (poemId -> emoji), migrate into device bucket
  if (all && typeof all[poemId] === 'string') {
    const migrated = { [DEVICE_REACTIONS_KEY]: { ...all } };
    Object.assign(all, migrated);
  }

  const user = getCurrentUser();
  if (user && user.id) {
    if (!all[user.id]) all[user.id] = {};
    all[user.id][poemId] = emoji;
  } else {
    if (!all[DEVICE_REACTIONS_KEY]) all[DEVICE_REACTIONS_KEY] = {};
    all[DEVICE_REACTIONS_KEY][poemId] = emoji;
  }
  safeSetItem(STORAGE_KEY_USER_REACTIONS, all);
}

export function getAllReactions() {
  return safeGetItem(STORAGE_KEY_REACTIONS, {});
}

export function getReactionLog() {
  return safeGetItem('letrasdepaz_reaction_log', []);
}

export function addReaction(poemId, emoji) {
  const all = safeGetItem(STORAGE_KEY_REACTIONS, {});
  if (!all[poemId]) all[poemId] = {};
  
  const currentReaction = getUserReaction(poemId);
  if (currentReaction === emoji) {
    // Already reacted with this emoji
    return all[poemId];
  }

  // If user already reacted with a different emoji, decrement the old one
  if (currentReaction && all[poemId][currentReaction] > 0) {
    all[poemId][currentReaction]--;
  }

  // Increment the new emoji
  all[poemId][emoji] = (all[poemId][emoji] || 0) + 1;
  safeSetItem(STORAGE_KEY_REACTIONS, all);

  // Save user's choice
  setUserReaction(poemId, emoji);

  // Log the reaction with timestamp for "new reactions" tracking
  const log = safeGetItem('letrasdepaz_reaction_log', []);
  log.push({ poemId, emoji, timestamp: Date.now() });
  // Keep only last 200 entries
  if (log.length > 200) log.splice(0, log.length - 200);
  safeSetItem('letrasdepaz_reaction_log', log);

  return all[poemId];
}

// ─── Comments ─────────────────────────────────────────────────────

export function getComments(poemId) {
  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  return (all[poemId] || []).sort((a, b) => b.timestamp - a.timestamp);
}

export function getAllComments() {
  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  const flat = [];
  for (const [poemId, comments] of Object.entries(all)) {
    for (const c of comments) {
      flat.push({ ...c, poemId });
    }
  }
  return flat.sort((a, b) => b.timestamp - a.timestamp);
}

export function addComment(poemId, { name, text }) {
  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  if (!all[poemId]) all[poemId] = [];
  all[poemId].push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name?.trim() || 'Anónimo',
    text: text.trim(),
    timestamp: Date.now(),
  });
  safeSetItem(STORAGE_KEY_COMMENTS, all);
  return getComments(poemId);
}

export function deleteComment(poemId, commentId) {
  const all = safeGetItem(STORAGE_KEY_COMMENTS, {});
  if (all[poemId]) {
    all[poemId] = all[poemId].filter(c => c.id !== commentId);
    safeSetItem(STORAGE_KEY_COMMENTS, all);
  }
}

// ─── Views ────────────────────────────────────────────────────────

export function getViews(poemId) {
  const all = safeGetItem(STORAGE_KEY_VIEWS, {});
  return all[poemId] || 0;
}

export function getAllViews() {
  return safeGetItem(STORAGE_KEY_VIEWS, {});
}

export function addView(poemId) {
  const all = safeGetItem(STORAGE_KEY_VIEWS, {});

  // Prevent double-counting from rapid duplicate calls (e.g., React StrictMode double mount)
  try {
    const key = `letrasdepaz_viewed_${poemId}`;
    const last = window.sessionStorage.getItem(key);
    const now = Date.now();
    const thresholdMs = 3000; // don't recount if last count was within 3s
    if (last && now - Number(last) < thresholdMs) {
      return all[poemId] || 0;
    }
    window.sessionStorage.setItem(key, String(now));
  } catch (e) {
    // sessionStorage might be unavailable; fall back to counting normally
  }

  all[poemId] = (all[poemId] || 0) + 1;
  safeSetItem(STORAGE_KEY_VIEWS, all);
  return all[poemId];
}

// ─── Custom Poems (admin panel) ───────────────────────────────────

export function getCustomPoems() {
  return safeGetItem(STORAGE_KEY_POEMS, []);
}

export function addCustomPoem({ title, body, excerpt }) {
  const poems = getCustomPoems();
  const newPoem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: title.trim(),
    body: body.trim(),
    excerpt: excerpt?.trim() || body.trim().split('\n')[0].slice(0, 80) + '...',
    date: new Date().toISOString().split('T')[0],
    isCustom: true,
  };
  poems.push(newPoem);
  safeSetItem(STORAGE_KEY_POEMS, poems);
  return newPoem;
}

export function deleteCustomPoem(poemId) {
  const poems = getCustomPoems().filter(p => p.id !== poemId);
  safeSetItem(STORAGE_KEY_POEMS, poems);
  return poems;
}

// ─── Helpers ──────────────────────────────────────────────────────

export function getPoemTitle(poemId, samplePoems) {
  const allPoems = [...getCustomPoems(), ...samplePoems];
  const poem = allPoems.find(p => p.id === poemId);
  return poem ? poem.title : 'Poema desconocido';
}
