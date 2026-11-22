/* ===== Storage (localStorage) and sample data ===== */
const KEY = 'sipstreak.html.v1';
const uid = (p) => p + Math.random().toString(36).slice(2, 9);
const SQUAD_COLORS = ['#35d6ff', '#5cf2b0', '#ffb86b', '#c9a6ff', '#ff8a9b'];

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function seed() {
  const now = Date.now(), H = 36e5;
  const at = (daysAgo, hour) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0); return d.getTime(); };
  const db = { users: [], squads: [], logs: [], session: null, settings: { caffeineOn: true, caffeineBonus: 200 } };
  // squads: [name, code, member progress % today]
  const defs = [
    ['Hostel Block A', 'HBA7Q2', [90, 80, 70, 60]],
    ['Hostel Block B', 'HBB4K9', [64, 90, 70, 64]],   // first member is the demo user, Priya
    ['Aqua Knights', 'AQK3M8', [70, 68, 66, 68]],
    ['Hydration Homies', 'HYD6P5', [60, 55, 62, 51]],
  ];
  const names = [['Aarav', 'Diya', 'Kabir', 'Meera'], ['Priya', 'Rohan', 'Sana', 'Vikram'], ['Ishaan', 'Neha', 'Arjun', 'Tara'], ['Kavya', 'Yash', 'Anaya', 'Dev']];
  defs.forEach(([name, code, pcts], si) => {
    const sq = { id: 'sq' + si, name, code, color: SQUAD_COLORS[si] };
    db.squads.push(sq);
    pcts.forEach((pct, mi) => {
      const u = { id: 'u' + si + mi, name: names[si][mi], email: '', weight: 60, customGoal: null, squadId: sq.id, hash: '', demo: si === 1 && mi === 0 };
      if (u.demo) u.email = 'priya@demo.dev';
      db.users.push(u);
      const goal = baseGoal(u), ml = Math.round((pct / 100) * goal);
      const first = Math.round(ml * 0.6 / 10) * 10;
      db.logs.push({ id: uid('l'), userId: u.id, ml: first, kind: 'water', at: at(0, 9) });
      if (ml - first > 0) db.logs.push({ id: uid('l'), userId: u.id, ml: ml - first, kind: 'water', at: at(0, 11) });
      // earlier days, so the history chart and streaks have data
      for (let d = 1; d <= 6; d++) {
        const frac = u.demo ? 1.05 : 0.7 + ((si * 3 + mi * 5 + d * 7) % 5) * 0.09; // the demo user already has a streak
        db.logs.push({ id: uid('l'), userId: u.id, ml: Math.round(goal * frac / 10) * 10, kind: 'water', at: at(d, 15) });
      }
    });
  });
  return db;
}

let db = load();
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { /* fall through */ }
  const fresh = seed(); localStorage.setItem(KEY, JSON.stringify(fresh)); return fresh;
}
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }
function resetAll() { localStorage.removeItem(KEY); db = load(); }
const me = () => db.users.find((u) => u.id === db.session) || null;

/* ---- account actions: each returns an error message, or '' on success ---- */
async function signup({ name, email, password, weight }) {
  name = name.trim(); email = email.trim().toLowerCase(); weight = Number(weight);
  if (name.length < 2 || name.length > 40) return 'Please enter your name (2 to 40 letters).';
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email.';
  if (password.length < 6) return 'Password needs at least 6 characters.';
  if (!(weight >= 25 && weight <= 250)) return 'Weight must be between 25 and 250 kg.';
  if (db.users.some((u) => u.email === email)) return 'An account with this email already exists.';
  const u = { id: uid('u'), name, email, weight, customGoal: null, squadId: null, hash: await sha256(email + ':' + password), demo: false };
  db.users.push(u); db.session = u.id; save(); return '';
}
async function login(email, password) {
  email = email.trim().toLowerCase();
  const u = db.users.find((x) => x.email === email && x.hash);
  if (!u || u.hash !== (await sha256(email + ':' + password))) return 'Email or password is incorrect.';
  db.session = u.id; save(); return '';
}
function loginDemo() { db.session = db.users.find((u) => u.demo).id; save(); }
function logout() { db.session = null; save(); }

/* ---- water actions ---- */
function addWater(ml, kind = 'water') {
  const u = me(); if (!u) return 'Please log in first.';
  ml = Math.round(Number(ml));
  if (!(ml >= 1 && ml <= 2000)) return 'Enter an amount between 1 and 2000 ml.';
  db.logs.push({ id: uid('l'), userId: u.id, ml, kind, at: Date.now() }); save(); return '';
}
function removeWater(ml) { // removes up to `ml` from today's newest drinks
  const u = me(); let left = ml;
  const todays = logsOn(db, u.id, today()).sort((a, b) => b.at - a.at);
  for (const l of todays) {
    if (left <= 0) break;
    if (l.ml <= left) { left -= l.ml; db.logs = db.logs.filter((x) => x.id !== l.id); }
    else { l.ml -= left; left = 0; }
  }
  save();
}
function setTodayTotal(total) {
  const u = me(); total = Math.round(Number(total));
  if (!(total >= 0 && total <= 10000)) return 'Enter a total between 0 and 10000 ml.';
  db.logs = db.logs.filter((l) => !(l.userId === u.id && dayKey(l.at) === today()));
  if (total > 0) db.logs.push({ id: uid('l'), userId: u.id, ml: total, kind: 'water', at: Date.now() });
  save(); return '';
}

/* ---- squads ---- */
function createSquad(name) {
  name = name.trim();
  if (name.length < 3 || name.length > 32) return 'Squad name needs 3 to 32 characters.';
  if (db.squads.some((s) => s.name.toLowerCase() === name.toLowerCase())) return 'That squad name is taken.';
  let code; do { code = Math.random().toString(36).slice(2, 8).toUpperCase(); } while (db.squads.some((s) => s.code === code));
  const s = { id: uid('sq'), name, code, color: SQUAD_COLORS[db.squads.length % SQUAD_COLORS.length] };
  db.squads.push(s); me().squadId = s.id; save(); return '';
}
function joinSquad(code) {
  const s = db.squads.find((x) => x.code === code.trim().toUpperCase());
  if (!s) return 'No squad has that invite code.';
  if (me().squadId !== s.id && members(db, s.id).length >= MAX_SQUAD) return `That squad is full (${MAX_SQUAD}/${MAX_SQUAD}).`;
  me().squadId = s.id; save(); return '';
}
function leaveSquad() { me().squadId = null; save(); }
