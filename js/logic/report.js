// Týdenní report pro učitele. Čistá logika: z dat spočítá čísla týdne a sestaví text zprávy.
import { localDateString, addDays, mondayOf, parseLocalDate } from './dates.js';
import { computeProgress } from './progress.js';

const FACES = { sad: '🙁', meh: '😐', happy: '🙂', great: '🤩' };

export function weekRange(monday) {
  const start = mondayOf(monday);
  return { start, end: addDays(start, 6), startKey: localDateString(start), endKey: localDateString(addDays(start, 6)) };
}

const inWeek = (dateKey, w) => dateKey >= w.startKey && dateKey <= w.endKey;

export function buildWeekReport({ monday, today = new Date(), sessions, missions, homework, journal, chords, chordProgress, clips = [] }) {
  const w = weekRange(monday);
  const weekSessions = sessions.filter((s) => inWeek(s.date, w));
  const seconds = weekSessions.reduce((sum, s) => sum + s.seconds, 0);
  const days = new Set(weekSessions.map((s) => s.date)).size;

  // Série na konci týdne (nebo dnes, pokud týden ještě běží)
  const endOfReport = w.endKey < localDateString(today) ? w.end : today;
  const streak = computeProgress(sessions, endOfReport).streak;

  const weekMissions = missions.filter((m) => inWeek(m.date, w));
  const questsDone = weekMissions.reduce((n, m) => n + m.quests.filter((q) => q.done).length, 0);
  const questsTotal = weekMissions.reduce((n, m) => n + m.quests.length, 0);

  // Domácí úkol: poslední zadaný do konce týdne
  const hw = [...homework].filter((h) => h.lessonDate <= w.endKey)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  const homeworkInfo = hw ? {
    text: hw.text, lessonDate: hw.lessonDate,
    done: Boolean(hw.doneAt) && localDateString(new Date(hw.doneAt)) <= w.endKey,
  } : null;

  const entries = journal.filter((j) => inWeek(j.date, w)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const learning = chords.filter((c) => chordProgress[c.id]?.learning || (chordProgress[c.id]?.stars ?? 0) > 0)
    .map((c) => ({ id: c.id, stars: chordProgress[c.id]?.stars ?? 0 }));

  return {
    week: w.startKey, startKey: w.startKey, endKey: w.endKey,
    minutes: Math.floor(seconds / 60), days, streak, questsDone, questsTotal,
    homework: homeworkInfo,
    learned: entries.map((j) => j.learned).filter(Boolean),
    stuck: entries.map((j) => j.stuck).filter(Boolean),
    feelings: entries.map((j) => j.feeling).filter(Boolean),
    chords: learning,
    clips: clips.map((c) => ({ title: c.title, seconds: c.seconds, kind: c.kind })),
  };
}

export const shortDate = (key, lang) => {
  const d = parseLocalDate(key);
  return lang === 'en' ? `${d.getDate()}/${d.getMonth() + 1}` : `${d.getDate()}. ${d.getMonth() + 1}.`;
};
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

// Text zprávy pro WhatsApp. t = překladová funkce z i18n.js
export function reportText(r, { t, lang, nickname = '' }) {
  const lines = [];
  const who = nickname ? ` · ${nickname}` : '';
  lines.push(`🎸 Struna${who} · ${t('report.week', { from: shortDate(r.startKey, lang), to: shortDate(r.endKey, lang) })}`);
  lines.push(`⏱ ${t('report.line.practice', { minutes: r.minutes, days: r.days, streak: r.streak })}`);
  if (r.questsTotal) lines.push(`✅ ${t('report.line.mission', { done: r.questsDone, total: r.questsTotal })}`);
  if (r.homework) {
    const status = r.homework.done ? t('report.hw.done') : t('report.hw.open');
    lines.push(`📝 ${t('report.line.homework', { date: shortDate(r.homework.lessonDate, lang), text: r.homework.text, status })}`);
  }
  for (const text of r.learned) lines.push(`💡 ${t('journal.learned')}: ${text}`);
  for (const text of r.stuck) lines.push(`🤔 ${t('journal.stuck')}: ${text}`);
  if (r.feelings.length) lines.push(`${t('report.line.feelings')}: ${r.feelings.map((f) => FACES[f] ?? '').join(' ')}`);
  if (r.chords.length) lines.push(`🎼 ${t('report.line.chords')}: ${r.chords.map((c) => `${c.id} ${stars(c.stars)}`).join(' · ')}`);
  if (r.clips.length) {
    lines.push(`🎙 ${t('report.line.clips', { n: r.clips.length })}: ${r.clips.map((c) => `${c.title} (${clock(c.seconds)})`).join(', ')}`);
  }
  if (!r.minutes && !r.questsDone && !r.learned.length) lines.push(t('report.line.empty'));
  return lines.join('\n');
}
