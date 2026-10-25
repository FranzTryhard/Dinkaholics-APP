# PROJECT STATUS: Dinkaholics — Smart Pickleball Matchmaking & Rotation

**Source Repository:** `FranzTryhard/Dinkaholics-APP`  
**Current State:** Fully functional, verified offline-first React 19 + TypeScript SPA on Vite 8 & Tailwind CSS v4.  
**Last Audit Date:** October 2026  
**Build & Test Health:** 27/27 automated unit & audit tests passing. `npm run lint` and `npm run build` pass with 0 errors.

---

## 1. Application Overview
Dinkaholics is an automated rotation, court management, and matchmaking app for recreational open play, club organizers, and pickleball tournament directors.

### Core Value Propositions:
- **Intelligent Doubles Rotation:** Evaluates skill rating (1–5), wait duration, game history, and teammate/opponent repetition to generate optimal, fair matches across active courts.
- **Multiple Rotation Modes:**
  - `balanced`: Skill balance and competitive parity.
  - `winner_stays`: Defending champions stay on court with configurable partner rules (`stay_together` vs `split_partners`) and `maxConsecutiveGames` caps.
  - `social`: Maximizes partner and opponent variety across all participants.
  - `king_of_court`: Ladder tier rotation with Court 1 as the King's Throne.
- **Round-Robin Bracket Generator:** Generates multi-round schedules with balanced byes, partner pairing diversity, and live tournament standings (points for/against, differential, win %).
- **Interactive Visual Court Scorekeeper:** Direct on-court digital scoreboard adhering to standard doubles pickleball rules (server 1/2, side-outs, rally vs side-out mode, Web Audio synthesizer effects, and full undo stack).
- **Player Analytics & History:** Win streaks, lifetime statistics, Recharts performance trend graphs (win rate, momentum, point diff), and CSV match export.

---

## 2. Architecture & File Structure

```
├── index.html                   # HTML entry point with PWA meta & font imports
├── metadata.json                # AI Studio application metadata
├── package.json                 # Dependencies & scripts (dev, build, lint)
├── vite.config.ts               # Vite 8 config with PWA & port 3000 host 0.0.0.0
├── src/
│   ├── main.tsx                 # React DOM root mounting
│   ├── App.tsx                  # Top-level state orchestration & view routing
│   ├── index.css                # Global Tailwind CSS v4 styling & typography tokens
│   ├── types/index.ts           # Central TypeScript types, interfaces, enums
│   ├── engine/
│   │   ├── config.ts            # Rotation configuration defaults & mode weights
│   │   ├── matchmaker.ts        # Matchmaking algorithms, scoring, and explanations
│   │   ├── roundRobin.ts        # Round-robin schedule generator & standings calculator
│   │   ├── storage.ts           # LocalStorage persistence & idempotent match recording
│   │   ├── mockData.ts          # Initial clean demo data structures
│   │   └── __tests__/
│   │       ├── run-tests.ts     # Engine unit test suite (16 assertions, 100% pass)
│   │       └── audit_suite.ts   # Comprehensive audit scenarios (11 tests, 100% pass)
│   ├── components/
│   │   ├── Navbar.tsx           # Desktop top bar with session info and tab navigation
│   │   ├── BottomNav.tsx        # Mobile tab bar with live court and queue count badges
│   │   ├── CourtCard.tsx        # Per-court card showing live match or recommendation
│   │   ├── HeroScoreCard.tsx    # Prominent live court hero widget
│   │   ├── CourtVisualScorekeeper.tsx # Interactive visual scoreboard & audio cues
│   │   ├── ScoreEntryModal.tsx  # Quick score recording with preset final scores
│   │   ├── ManualMatchModal.tsx # Manual match assignment & auto-balancer
│   │   ├── SessionSetupModal.tsx # New session configuration wizard
│   │   ├── EndSessionModal.tsx  # End session recap with performance awards
│   │   ├── PlayerCard.tsx       # Player summary badge with status and level
│   │   ├── PlayerDetailModal.tsx # Full player profile, streak, & trend chart modal
│   │   ├── PlayerPerformanceTrendsChart.tsx # Recharts performance curves
│   │   ├── WaitingQueue.tsx     # Live queue of waiting players with wait timers
│   │   ├── SessionInsights.tsx  # Session health statistics & court utilization
│   │   ├── DinkaholicsLogo.tsx  # SVG/image brand asset component
│   │   ├── PickleballIcon.tsx   # Domain-specific SVG icon
│   │   └── OfflineIndicator.tsx # Network state indicator
│   ├── views/
│   │   ├── DashboardView.tsx    # Live session command center
│   │   ├── CourtsView.tsx       # Court-by-court monitor & match trigger
│   │   ├── PlayersView.tsx      # Roster management, adding players, rating edits
│   │   ├── LeaderboardView.tsx  # Session & lifetime ranked leaderboards
│   │   ├── RoundRobinView.tsx   # Tournament bracket, match cards, & standings
│   │   ├── HistoryView.tsx      # Chronological match logs & CSV download
│   │   └── SettingsView.tsx     # Rotation engine weights & storage maintenance
│   └── utils/audio.ts           # Web Audio API synthesizer for court sounds
```

---

## 3. Completed Features (Verified)
- [x] Multi-court matchmaking engine with balance, fairness, and variety scoring.
- [x] Winner-stays mode with forced rotation after max consecutive games limit.
- [x] King of Court ladder advancement mode.
- [x] Social rotation mode prioritizing novel partnerships.
- [x] Round-Robin tournament generator and live standings.
- [x] Interactive visual scorekeeper with server tracking, side-out rules, and audio synthesizer.
- [x] Recharts trend curves (win rate, momentum, point differential).
- [x] CSV export of completed session matches.
- [x] PWA offline support and Web Audio API offline sound.
- [x] Idempotent match completion preventing duplicate win/loss counting.
- [x] Automated test suites in `src/engine/__tests__/`.

---

## 4. Resolved Issues
- **Match Result Saving Freeze / Delay:** In `CourtVisualScorekeeper.tsx`, `handleConfirmFinish` set `isSubmitting = true` (changing button state to "Recording Result...") but never invoked the passed `onFinishMatch(match.id, scoreA, scoreB, winner)` prop. This caused the UI to hang indefinitely on the victory screen. Resolved by wiring `onFinishMatch` with error handling.

---

## 5. Known Technical Nuances & Incomplete Sync Points
1. **Round-Robin Match Logging:** Completed tournament matches currently persist in their own localStorage key (`picklematch_roundrobin_rounds`) and do not automatically record into the main session match log (`picklematch_matches_v1`) or update player lifetime win totals.
2. **Local Storage Scoping:** Data is stored locally on the client device. Multi-device shared court synchronization is not yet implemented.
3. **Storage Key Naming:** Uses legacy `picklematch_*` storage keys from before the Dinkaholics rebrand.

---

## 6. Next Recommended Actions
1. Confirm user acceptance of the match saving fix in the live development app.
2. Align on whether Round-Robin matches should auto-sync into session history.
3. Address any additional requested features.
1. Clarify remaining backlog/intent with the user (see turn questions).
2. Establish priority for:
   - Synchronizing Round-Robin match results into session history & player statistics.
   - Any requested UI/UX improvements or new club features.
   - Remote multi-device synchronization if desired.
