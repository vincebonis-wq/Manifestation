/* =====================================================================
   SYNC — synchronisation temps réel Mac <-> iPhone via Firebase.
   Module ES. Charge le SDK Firebase à la demande (uniquement si configuré).
   Expose window.Sync. Sans config, l'app reste 100% locale.
   ===================================================================== */
(() => {
'use strict';

const CFG_KEY = 'manifest.fb';        // config Firebase (collée par l'utilisateur)
const SDK = 'https://www.gstatic.com/firebasejs/10.12.5';

let fb = null;                        // { app, auth, db, fns... }
let user = null;
let status = 'off';                   // off | connecting | online | error | signed-out
let statusMsg = '';
let unsub = null;                     // firestore snapshot unsubscribe
let remoteCb = null;
let statusCbs = [];
let pushTimer = null;
let lastPushed = null;

function getConfig() {
  try { const r = localStorage.getItem(CFG_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function setConfig(obj) {
  if (!obj || !obj.apiKey || !obj.projectId) throw new Error('Config invalide');
  localStorage.setItem(CFG_KEY, JSON.stringify(obj));
}
function clearConfig() { localStorage.removeItem(CFG_KEY); }
const isConfigured = () => !!getConfig();

function setStatus(s, msg='') { status = s; statusMsg = msg; statusCbs.forEach(cb => { try { cb(s, msg, user); } catch {} }); }

async function loadSDK() {
  if (fb) return fb;
  const [appMod, authMod, fsMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const cfg = getConfig();
  const app = appMod.initializeApp(cfg);
  const auth = authMod.getAuth(app);
  // offline cache so l'app marche sans réseau et se resynchronise
  let db;
  try {
    db = fsMod.initializeFirestore(app, {
      localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() })
    });
  } catch { db = fsMod.getFirestore(app); }

  fb = { app, auth, db, authMod, fsMod };
  return fb;
}

async function init() {
  if (!isConfigured()) { setStatus('off'); return; }
  setStatus('connecting');
  try {
    const { auth, authMod } = await loadSDK();
    await authMod.setPersistence(auth, authMod.browserLocalPersistence).catch(()=>{});
    authMod.onAuthStateChanged(auth, u => {
      user = u ? { uid: u.uid, email: u.email } : null;
      if (u) { setStatus('online'); listen(u.uid); }
      else   { if (unsub) { unsub(); unsub = null; } setStatus('signed-out'); }
    });
  } catch (e) {
    setStatus('error', e.message || String(e));
  }
}

function listen(uid) {
  const { db, fsMod } = fb;
  if (unsub) unsub();
  const ref = fsMod.doc(db, 'users', uid);
  unsub = fsMod.onSnapshot(ref,
    { includeMetadataChanges:false },
    snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data && data.state && remoteCb) {
        // n'applique pas l'écho de notre propre écriture
        if (lastPushed && data.updatedAt === lastPushed) return;
        try { remoteCb(JSON.parse(data.state), data.updatedAt || 0); } catch {}
      }
    },
    err => setStatus('error', err.message || String(err))
  );
}

/* pousse l'état (debounce). state = objet complet, ts = updatedAt (ms) */
function push(state, ts) {
  if (status !== 'online' || !user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      const { db, fsMod } = fb;
      lastPushed = ts;
      await fsMod.setDoc(fsMod.doc(db, 'users', user.uid), {
        state: JSON.stringify(state),
        updatedAt: ts,
        device: navigator.platform || 'web',
      });
    } catch (e) { setStatus('error', e.message || String(e)); }
  }, 400);
}

async function signIn(email, password, create=false) {
  const { auth, authMod } = await loadSDK();
  const fn = create ? authMod.createUserWithEmailAndPassword : authMod.signInWithEmailAndPassword;
  await fn(auth, email.trim(), password);
}
async function signOut() {
  if (!fb) return;
  await fb.authMod.signOut(fb.auth);
}

window.Sync = {
  isConfigured, getConfig, setConfig, clearConfig,
  init, push, signIn, signOut,
  onRemote: cb => remoteCb = cb,
  onStatus: cb => { statusCbs.push(cb); cb(status, statusMsg, user); },
  get status(){ return status; },
  get statusMsg(){ return statusMsg; },
  get user(){ return user; },
  isOnline: () => status === 'online' && !!user,
};

})();
