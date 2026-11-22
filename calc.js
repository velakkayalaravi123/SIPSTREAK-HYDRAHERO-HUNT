/* ===== SipStreak scoring logic (pure functions, no page code) ===== */
const ML_PER_KG = 35;
const MAX_SQUAD = 8;
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD in the user's own timezone
const today = () => dayKey(Date.now());

/** Base goal = weight x 35 ml, rounded to 10 ml (or the user's custom goal). */
function baseGoal(user) {
  return user.customGoal || Math.round((user.weight * ML_PER_KG) / 10) * 10;
}
function logsOn(db, userId, day) {
  return db.logs.filter((l) => l.userId === userId && dayKey(l.at) === day);
}
/** Caffeine game rule: every coffee / energy drink raises that day's goal by the bonus (if the rule is on). */
function goalFor(db, user, day) {
  const bonus = db.settings.caffeineOn ? db.settings.caffeineBonus : 0;
  const caf = logsOn(db, user.id, day).filter((l) => l.kind !== 'water').length;
  return baseGoal(user) + caf * bonus;
}
function intake(db, user, day) {
  return logsOn(db, user.id, day).reduce((a, l) => a + l.ml, 0);
}
/** Progress is capped at 100% so nobody can carry (or hide behind) the team. */
function progress(db, user, day) {
  return Math.min(1, intake(db, user, day) / goalFor(db, user, day));
}
function members(db, squadId) {
  return db.users.filter((u) => u.squadId === squadId);
}
/** Team Fair Participation Formula: average of the members' capped progress x 100. */
function teamScore(db, squadId, day) {
  const m = members(db, squadId);
  if (!m.length) return 0;
  return (m.reduce((a, u) => a + progress(db, u, day), 0) / m.length) * 100;
}
function ranking(db, day) {
  return db.squads
    .map((s) => ({ squad: s, score: teamScore(db, s.id, day), size: members(db, s.id).length }))
    .sort((a, b) => b.score - a.score || b.size - a.size);
}
function dayOffset(n) { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); }
/** Consecutive days (ending today, or yesterday if today is not done yet) with the goal reached. */
function streak(db, user) {
  let n = 0, i = progress(db, user, today()) >= 1 ? 0 : 1;
  for (; i < 400; i++) { if (progress(db, user, dayOffset(i)) >= 1) n++; else break; }
  return n;
}
function week(db, user) {
  return [6, 5, 4, 3, 2, 1, 0].map((i) => {
    const day = dayOffset(i);
    return { day, label: new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }), ml: intake(db, user, day), goal: goalFor(db, user, day) };
  });
}
