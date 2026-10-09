# Ascend — SAT Study Planner

A local-first SAT planner built with React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide, and Recharts. No backend, account, API key, or question-bank connection is required. Record the questions you complete in your own question bank.

## Run

Use Node.js 22 or later (validated with Node 24.19.0 and npm 11.9.0).

```bash
cd /workspace/yousef
npm ci
npm run dev -- --strictPort
```

The development server listens on port **5173**. Use your development platform’s supported browser access mechanism to open it.

```bash
npm test                 # Progress engine tests
npm run test:browser     # Chromium integration tests
npm run build            # Type-check and create dist/
npm run preview          # Serve the production build on port 4173
```

Browser tests use `/usr/bin/chromium` when installed, or `CHROMIUM_PATH` if supplied. Otherwise, install Playwright Chromium with `npx playwright install chromium`. No downloaded browser is necessary in the prepared cloud environment. Browser tests launch the dev server automatically if it is not already running. Screenshots are written to `/tmp/ascend-desktop.png`, `/tmp/ascend-mobile.png`, and `/tmp/ascend-calendar.png`. Failed tests retain traces in `test-results/`.

## Your plan

- Study period: October 9 through November 6, 2026; exam: November 7.
- Starting scores: **1300 total · 570 English · 730 Math**.
- Targets: **1400+ total · 650+ English · 750+ Math**.
- Saturday–Thursday: **35 English + 15 Math**.
- Friday: **50 English + 20 Math**.
- Full-length practice tests replace question missions on **October 16, 23, and 30**. Scores are optional and must be in 10-point increments from 200–800 per section.
- Study dates are based on the browser’s local calendar, including the exam countdown. The current week starts on Monday.

## Progress and reward rules

All views use `src/engine.ts`; nothing awards XP in a rendering effect.

- Questions earn 10 XP each. Reaching a subject goal earns 50 XP, and completing both goals earns another 100 XP.
- Practice missions earn the 100 XP daily bonus instead of question/subject bonuses.
- A complete Monday–Sunday study week earns 300 XP. All seven days must be within the study period and complete; freezes do not qualify. The initial partial week does not award this bonus.
- XP is derived from the activity ledger. Undo removes the last entry for the selected subject, including any subject, daily, and weekly bonuses it no longer qualifies for. Extra questions are allowed beyond targets; an individual entry can contain 1–10,000 questions.
- A complete mission adds one streak day, regardless of extra questions. Pending today does not break yesterday’s streak.
- Begin with one freeze. Earn another after each seven completed study days, up to a capacity of two. On rollover, a freeze protects a missed day only when there is an existing streak to preserve. It never increases the streak count. Once a day is closed, its frozen/missed status is fixed.
- Achievements are permanent once unlocked, with the original unlock date. Undo reverses XP and current completion, but does not revoke commemorative badges.
- Levels start at 500 XP, with each next level requiring 150 more XP than the previous one.
- Every opened day stores its own target snapshot. Settings changes apply to unopened future days and never rewrite past targets, counts, or actions. Extending the exam date extends the study period.

## Storage, dates, and accessibility

- Progress is stored in browser `localStorage` under `ascend.sat.v1`, with a versioned schema and validated JSON import/export.
- Import shows a confirmation and replaces this device’s progress. Export first if you want to retain the old data. Invalid or unreadable saved data is preserved, and logging pauses until recovery.
- There is no cloud backup. Clearing browser data or switching origins/browsers gives a separate workspace. Use Settings → Export JSON regularly.
- The storage adapter in `src/usePlanner.ts` is separate from the pure engine, allowing a backend or account-sync repository to be introduced later.
- Multiple tabs synchronize using storage events. Web Locks serialize read/modify/write operations on supported browsers (including the tested Chromium); browsers without Web Locks use a best-effort localStorage fallback.
- Local `YYYY-MM-DD` keys define days. Calendar arithmetic uses UTC noon internally to avoid DST-length errors. A forward-only date watermark prevents reopening closed days when the clock/timezone moves backward. Logging pauses until the local date catches up.
- **Offline limit:** there is no trusted server clock. Deliberately moving the OS clock forward or editing browser storage/exported JSON cannot be made tamper-proof. The app provides no historical date-editing control or retroactive freeze button.
- Dialogs have focus trapping and Escape dismissal. Controls have accessible labels; data charts provide text summaries. Reduced-motion system preferences and app settings are respected.
- Reminders are gentle in-app notices while the site is open, not background or OS notifications. Sound is optional and generated locally with Web Audio.

## Project structure

```text
src/engine.ts          Pure progress, rewards, calendar, validation, and serialization
src/engine.test.ts     Unit tests for streaks, freezes, XP, dates, and persistence
src/usePlanner.ts      Storage, cross-tab synchronization, and daily rollover
src/App.tsx            Dashboard and all feature screens
src/styles.css        Responsive themes and animations
src/main.tsx          React entry point
tests/planner.spec.ts  Desktop/mobile integration tests
```

No seeded activity or fabricated progress appears in the app. Your journey starts from zero logged questions.
