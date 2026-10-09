export type Subject = 'english' | 'math'
export type DateKey = string
export interface Settings {
  english: number; math: number; fridayEnglish: number; fridayMath: number
  exam: DateKey; target: number; sound: boolean; animations: boolean
  theme: 'dark' | 'light'; reducedMotion: boolean; reminder: boolean; reminderTime: string; quote: boolean
}
export interface Day {
  englishTarget: number; mathTarget: number; practice: boolean
  actions: { subject: Subject; count: number }[]
  reviews: [boolean, boolean]; test: { completed: boolean; english: number | null; math: number | null }
  closed: boolean; frozen: boolean
}
export interface State {
  version: 1; settings: Settings; days: Record<DateKey, Day>; lastSeen: DateKey
  achievements: Record<string, DateKey>
}
export const START = '2026-10-09'
export const PRACTICE = ['2026-10-16', '2026-10-23', '2026-10-30']
export const DEFAULT_SETTINGS: Settings = { english: 35, math: 15, fridayEnglish: 50, fridayMath: 20, exam: '2026-11-07', target: 1400, sound: false, animations: true, theme: 'dark', reducedMotion: false, reminder: false, reminderTime: '18:00', quote: true }
export const MILESTONES = [3, 7, 14, 21, 30]
export const STORAGE_KEY = 'ascend.sat.v1'
// Local calendar keys determine study days. UTC is used only for DST-safe calendar arithmetic.
export function dateKey(date = new Date()): DateKey { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function parseDate(key: DateKey) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, 12) }
export function addDays(key: DateKey, n: number): DateKey { const date = new Date(`${key}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + n); return date.toISOString().slice(0, 10) }
export function dayDiff(a: DateKey, b: DateKey) { return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000) }
export function dates(a: DateKey, b: DateKey): DateKey[] { const n = Math.max(0, Math.min(3660, dayDiff(a, b) + 1)); return Array.from({ length: n }, (_, i) => addDays(a, i)) }
export function weekStart(key: DateKey) { return addDays(key, -((parseDate(key).getDay() + 6) % 7)) }
export function required(state: State, key: DateKey) { return key >= START && key < state.settings.exam }
export function newDay(settings: Settings, key: DateKey): Day {
  const friday = parseDate(key).getDay() === 5
  return { englishTarget: friday ? settings.fridayEnglish : settings.english, mathTarget: friday ? settings.fridayMath : settings.math, practice: PRACTICE.includes(key), actions: [], reviews: [false, false], test: { completed: false, english: null, math: null }, closed: false, frozen: false }
}
export function getDay(s: State, key: DateKey) { return s.days[key] ?? newDay(s.settings, key) }
export function count(d: Day, subject: Subject) { return d.actions.filter(a => a.subject === subject).reduce((sum, a) => sum + a.count, 0) }
export function complete(d: Day) { return d.practice ? d.test.completed : count(d, 'english') >= d.englishTarget && count(d, 'math') >= d.mathTarget }
export function progress(d: Day) { return d.practice ? Number(d.test.completed) : (Math.min(1, count(d, 'english') / d.englishTarget) + Math.min(1, count(d, 'math') / d.mathTarget)) / 2 }
export function dayXP(d: Day) { return 10 * (count(d, 'english') + count(d, 'math')) + (d.practice ? 0 : (count(d, 'english') >= d.englishTarget ? 50 : 0) + (count(d, 'math') >= d.mathTarget ? 50 : 0)) + (complete(d) ? 100 : 0) }
export function fullWeek(s: State, start: DateKey) { return dates(start, addDays(start, 6)).every(k => required(s, k) && !!s.days[k] && complete(s.days[k])) }
export function totalXP(s: State) {
  const weeks = new Set(Object.keys(s.days).map(weekStart))
  return Object.values(s.days).reduce((n, d) => n + dayXP(d), 0) + [...weeks].filter(w => fullWeek(s, w)).length * 300
}
export function level(xp: number) {
  let current = 1; let remaining = xp; let needed = 500
  while (remaining >= needed) { remaining -= needed; current++; needed = 500 + (current - 1) * 150 }
  const title = current >= 30 ? 'SAT Legend' : current >= 20 ? 'SAT Master' : current >= 15 ? 'SAT Warrior' : current >= 10 ? 'Focused Student' : current >= 5 ? 'Consistent Learner' : 'Beginner'
  return { current, remaining, needed, title }
}
export function streaks(s: State, today: DateKey) {
  let current = 0, longest = 0, completed = 0, freezes = 1
  for (const key of Object.keys(s.days).sort()) {
    if (key > today) continue
    const d = s.days[key]
    if (complete(d)) { current++; completed++; longest = Math.max(longest, current); if (completed % 7 === 0) freezes = Math.min(2, freezes + 1) }
    else if (d.frozen) freezes = Math.max(0, freezes - 1)
    else if (key < today && d.closed) current = 0
  }
  return { current, longest, completed, freezes }
}
export const BADGES = [
  { id: 'first', name: 'First Step', description: 'Complete your first study day.', icon: 'footprints' },
  { id: 'three', name: 'Three in a Row', description: 'Reach a 3-day streak.', icon: 'flame' },
  { id: 'week', name: 'One Week Strong', description: 'Reach a 7-day streak.', icon: 'zap' },
  { id: 'english', name: 'English Grinder', description: 'Complete 500 English questions.', icon: 'book' },
  { id: 'math', name: 'Math Machine', description: 'Complete 250 Math questions.', icon: 'calculator' },
  { id: 'consistent', name: 'Consistency King', description: 'Complete 14 study days.', icon: 'crown' },
  { id: 'century', name: 'Century Club', description: 'Complete 100 questions in one day.', icon: 'target' },
  { id: 'legend', name: 'SAT Legend', description: 'Reach a 30-day streak.', icon: 'trophy' },
  { id: 'perfect', name: 'Perfect Week', description: 'Complete every mission Monday–Sunday.', icon: 'star' },
]
export function unlock(s: State, today: DateKey) {
  const stats = streaks(s, today), ds = Object.values(s.days)
  const earned = [stats.completed >= 1, stats.longest >= 3, stats.longest >= 7, ds.reduce((n, d) => n + count(d, 'english'), 0) >= 500, ds.reduce((n, d) => n + count(d, 'math'), 0) >= 250, stats.completed >= 14, ds.some(d => count(d, 'english') + count(d, 'math') >= 100), stats.longest >= 30, Object.keys(s.days).some(k => fullWeek(s, weekStart(k)))]
  earned.forEach((yes, i) => { if (yes && !s.achievements[BADGES[i].id]) s.achievements[BADGES[i].id] = today })
}
export function initialState(today = dateKey()): State { return reconcile({ version: 1, settings: { ...DEFAULT_SETTINGS }, days: {}, lastSeen: today, achievements: {} }, today) }
// Closed days and a forward-only date watermark prevent retroactive freeze use.
// A fully offline app cannot authenticate the operating system clock or edited JSON.
export function reconcile(input: State, today = dateKey()): State {
  const s = structuredClone(input)
  if (today < s.lastSeen) return s
  const end = today < s.settings.exam ? today : addDays(s.settings.exam, -1)
  for (const key of dates(START, end)) {
    const d = s.days[key] ??= newDay(s.settings, key)
    if (key < today && !d.closed) {
      const prior = streaks(s, addDays(key, -1))
      if (!complete(d) && prior.current > 0 && prior.freezes > 0) d.frozen = true
      d.closed = true
    }
  }
  s.lastSeen = today
  unlock(s, today)
  return s
}
export type Action = { type: 'add'; subject: Subject; count: number } | { type: 'undo'; subject: Subject } | { type: 'review'; index: 0 | 1 } | { type: 'test'; completed: boolean; english: number | null; math: number | null }
export function act(input: State, today: DateKey, action: Action): State {
  const s = reconcile(input, today)
  if (today < s.lastSeen || !required(s, today) || s.days[today]?.closed) return s
  const d = s.days[today] ??= newDay(s.settings, today)
  if (action.type === 'add' && !d.practice && Number.isInteger(action.count) && action.count > 0 && action.count <= 10000) d.actions.push({ subject: action.subject, count: action.count })
  if (action.type === 'undo') { const index = d.actions.map(a => a.subject).lastIndexOf(action.subject); if (index >= 0) d.actions.splice(index, 1) }
  if (action.type === 'review') d.reviews[action.index] = !d.reviews[action.index]
  if (action.type === 'test' && d.practice && [action.english, action.math].every(n => n === null || Number.isInteger(n) && n >= 200 && n <= 800 && n % 10 === 0)) d.test = { completed: action.completed, english: action.english, math: action.math }
  unlock(s, today)
  return s
}
export function updateSettings(input: State, settings: Settings, today: DateKey) {
  const s = reconcile(input, today)
  s.settings = settings
  // A day's targets are a snapshot: settings changes affect unopened future days.
  return reconcile(s, today)
}
export function weekStats(s: State, start: DateKey) {
  const keys = dates(start, addDays(start, 6)).filter(k => required(s, k))
  const days = keys.map(k => getDay(s, k))
  return { english: days.reduce((n, d) => n + count(d, 'english'), 0), math: days.reduce((n, d) => n + count(d, 'math'), 0), completed: days.filter(complete).length, progress: days.length ? days.reduce((n, d) => n + progress(d), 0) / days.length : 0, xp: days.reduce((n, d) => n + dayXP(d), 0) + (fullWeek(s, start) ? 300 : 0), plannedDays: keys.length }
}
export function status(s: State, key: DateKey, today: DateKey) {
  if (!required(s, key)) return 'outside'
  if (key > today) return 'upcoming'
  const d = getDay(s, key)
  return complete(d) ? 'complete' : d.frozen ? 'frozen' : key < today ? 'missed' : progress(d) > 0 ? 'partial' : 'pending'
}
function validDate(x: unknown): x is string { return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && new Date(`${x}T12:00:00Z`).toISOString().slice(0, 10) === x }
export function decode(raw: string): State {
  if (raw.length > 5_000_000) throw new Error('This file is too large. Choose an Ascend progress export under 5 MB.')
  const s = JSON.parse(raw) as State
  const fail = () => { throw new Error('Invalid progress file. Choose an unmodified Ascend JSON export.') }
  if (!s || s.version !== 1 || !s.settings || !s.days || !s.achievements || !validDate(s.lastSeen)) fail()
  const cfg = s.settings
  if (!validDate(cfg.exam) || cfg.exam <= START || cfg.exam > '2036-10-09' || !Number.isInteger(cfg.target) || cfg.target < 400 || cfg.target > 1600) fail()
  if (![cfg.english, cfg.math, cfg.fridayEnglish, cfg.fridayMath].every(n => Number.isInteger(n) && n > 0 && n <= 10000)) fail()
  if (![cfg.sound, cfg.animations, cfg.reducedMotion, cfg.reminder, cfg.quote].every(x => typeof x === 'boolean') || !['dark', 'light'].includes(cfg.theme) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(cfg.reminderTime)) fail()
  if (Array.isArray(s.days) || Object.keys(s.days).length > 3660 || Array.isArray(s.achievements)) fail()
  for (const [key, d] of Object.entries(s.days)) {
    if (!validDate(key) || key < START || key > s.lastSeen || !d || ![d.englishTarget, d.mathTarget].every(n => Number.isInteger(n) && n > 0 && n <= 10000) || d.practice !== PRACTICE.includes(key)) fail()
    if (!Array.isArray(d.actions) || d.actions.length > 100000 || !d.actions.every(a => a && ['english', 'math'].includes(a.subject) && Number.isInteger(a.count) && a.count > 0 && a.count <= 10000)) fail()
    if (!Array.isArray(d.reviews) || d.reviews.length !== 2 || !d.reviews.every(x => typeof x === 'boolean') || !d.test || ![d.test.completed, d.closed, d.frozen].every(x => typeof x === 'boolean')) fail()
    if (![d.test.english, d.test.math].every(n => n === null || Number.isInteger(n) && n >= 200 && n <= 800 && n % 10 === 0)) fail()
    if (d.frozen && (!d.closed || complete(d))) fail()
  }
  if (Object.entries(s.achievements).some(([id, key]) => !BADGES.some(b => b.id === id) || !validDate(key) || key > s.lastSeen || key < START)) fail()
  return s
}
export function load(storage: Pick<Storage, 'getItem'>, today = dateKey()) { const raw = storage.getItem(STORAGE_KEY); return raw ? reconcile(decode(raw), today) : initialState(today) }
export function save(storage: Pick<Storage, 'setItem'>, s: State) { storage.setItem(STORAGE_KEY, JSON.stringify(s)) }
