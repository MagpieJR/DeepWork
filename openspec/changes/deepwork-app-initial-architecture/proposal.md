## Why

DeepWork is a mobile productivity app designed to help users enter and sustain deep focus sessions. No equivalent app combines friction-free pomodoro timing, ambient audio, structured task management, and offline-first cross-device sync in a minimal, futuristic UI.

## What Changes

This is the initial creation of the DeepWork mobile application. All capabilities are new.

- New React Native (Expo) mobile app for iOS and Android
- Focus timer with long-press-to-abandon UX and extra focus mode
- Three-tier task system: daily, scheduled, and weekly tasks
- Tag system with customizable default pomodoro durations and hierarchical duration resolution
- Five ambient white noise tracks with independent per-track volume control
- Statistics dashboard showing completed and abandoned sessions per task and tag
- Offline-first data layer with Supabase PostgreSQL sync using Last-Write-Wins + Soft Delete strategy
- Authentication via Google, Apple, and Email (Supabase Auth)

## Capabilities

### New Capabilities

- `focus-timer`: Core pomodoro timer with long-press-to-abandon (5 seconds), extra focus mode (silent continuation after timer ends, tap to stop, records extra minutes), and optional tag/task binding before start
- `task-management`: Three task types (daily reset at 12:00 local, scheduled with required time, weekly reset on Sunday) with per-type incomplete handling and reminder configuration
- `tag-system`: User-defined tags required for all tasks; each tag carries a default pomodoro duration; duration priority resolves as task-specific > tag default > global default; timer page allows tag-only start which records to a built-in free-focus slot
- `white-noise`: Five ambient audio tracks (rain, café, ocean, forest, white noise) with independent volume sliders, playable in background during focus sessions; volume configurable from timer page and settings page
- `focus-statistics`: Today/week toggle view showing completed pomodoro count, abandoned pomodoro count with visual differentiation, extra focus minutes, and per-task breakdown
- `auth-sync`: Supabase Auth (Google, Apple, Email) with offline-first local SQLite storage, background sync to Supabase PostgreSQL on reconnect using Last-Write-Wins conflict resolution (updated_at timestamp) and Soft Delete (deleted_at column)

### Modified Capabilities

(none — this is a new application)

## Impact

- Affected specs: focus-timer, task-management, tag-system, white-noise, focus-statistics, auth-sync
- Affected code:
  - New: src/
  - New: src/screens/TimerScreen.tsx
  - New: src/screens/TaskScreen.tsx
  - New: src/screens/StatisticsScreen.tsx
  - New: src/screens/SettingsScreen.tsx
  - New: src/stores/timerStore.ts
  - New: src/stores/taskStore.ts
  - New: src/stores/tagStore.ts
  - New: src/stores/audioStore.ts
  - New: src/stores/statsStore.ts
  - New: src/db/schema.ts
  - New: src/db/sync.ts
  - New: src/services/supabase.ts
  - New: app.json
  - New: package.json
