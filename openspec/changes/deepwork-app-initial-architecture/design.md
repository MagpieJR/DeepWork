## Context

DeepWork is a new mobile application built from scratch. There is no existing codebase to migrate. The app targets iOS and Android via React Native with Expo Managed Workflow. All architectural decisions start fresh.

The primary user is a solo developer with no prior React Native experience, so simplicity of the development environment and clear separation of concerns are primary constraints.

## Goals / Non-Goals

**Goals:**

- Deliver a working focus timer with tag/task binding and extra focus mode
- Implement three-type task management (daily, scheduled, weekly) with tag requirement
- Provide offline-first data persistence with background Supabase sync
- Support ambient white noise playback during focus sessions
- Show meaningful statistics (today/week, completed vs abandoned, per-task)
- Enable Google, Apple, and Email authentication via Supabase Auth

**Non-Goals:**

- No team or shared workspace features
- No in-app purchases or subscription management
- No custom notification sounds (system default only)
- No iPad-specific layout optimization in v1
- No widget or Apple Watch support
- No social or sharing features
- No Android Wear OS support

## Decisions

### Expo Managed Workflow over Bare React Native

Using Expo Managed Workflow as the development foundation.

**Rationale:** Bare RN requires manual Xcode and Android Studio native module linking, which creates a high barrier for a developer with no prior RN experience. Expo handles environment setup, OTA updates, and device testing via Expo Go. All required native capabilities (background audio, local notifications, SQLite, gestures) are available through Expo's SDK.

**Alternative considered:** Bare React Native ? rejected due to environment configuration complexity and longer onboarding time for a solo beginner.

### Supabase over Firebase

Using Supabase (PostgreSQL) as the cloud backend and authentication provider.

**Rationale:** Supabase provides a relational data model that maps cleanly to the app's structured data (tasks, tags, sessions). The developer chose Supabase to understand sync logic firsthand rather than delegating it to Firebase's opaque offline SDK. The free tier is more generous for write-heavy workloads at small scale.

**Alternative considered:** Firebase Firestore ? rejected because the developer prefers PostgreSQL's relational model and wants to implement sync logic explicitly as a learning exercise.

### Offline-First with Last-Write-Wins Sync

Local Expo SQLite is the source of truth during offline periods. Supabase is the sync target, not the primary data store.

**Sync strategy:** Every table carries `updated_at TIMESTAMPTZ` and `deleted_at TIMESTAMPTZ`. Deletes are soft (set `deleted_at`, never `DELETE`). On reconnect, the app pushes all rows where `updated_at > last_synced_at` and pulls all remote rows where `updated_at > last_synced_at`. Conflict resolution: the row with the larger `updated_at` wins.

**Rationale:** Session records (pomodoro logs) are append-only ? they never conflict. Task and tag records change rarely and rarely on two devices simultaneously. LWW is sufficient for this access pattern and avoids merge complexity.

### Zustand for State Management

Using Zustand as the client state manager.

**Rationale:** Zustand has minimal boilerplate, straightforward TypeScript support, and is well-suited for a solo developer. Redux is rejected for its ceremony overhead. React Context is rejected because granular re-render control is important for the timer screen.

### Duration Priority Resolution

Timer duration is resolved at session start using this chain:

`task.custom_duration ?? tag.default_duration ?? settings.global_duration`

Resolution happens once when the session begins. Changing a tag's default after a session starts does not affect the running session. Historical session records store the actual duration used ? they are never recalculated from the current tag or task settings.

### Tag-Only Timer Sessions and Free-Focus Slot

When the user starts a timer from the timer screen with only a tag selected (no task), the session is attributed to a built-in virtual task called "Free Focus" within that tag. This virtual task is created automatically on tag creation, is never visible in the task list, and exists solely as a statistics bucket.

**Data shape:** `task_id` on Session may be NULL for pre-existing data migration purposes, but all new sessions from the timer always carry a `task_id` ? either a real task or the tag's free-focus task.

### Navigation Structure

Using React Navigation v6 with a bottom tab navigator (Timer, Tasks, Statistics, Settings) and stack navigators within each tab for sub-screens.

The app has a Login screen as a root-level gate. Users who are not authenticated SHALL land on the Login screen and SHALL NOT access the main tab navigator. On successful login, the app navigates to the Settings tab.

### Settings Screen Layout

The Settings screen is divided into two sections:

```
Settings Screen
├── Account Section (top)
│   ├── Avatar / profile picture
│   ├── Display name (editable)
│   ├── Email address
│   └── Sign out button
└── App Settings Section (below)
    ├── Global pomodoro duration
    ├── Notification type (vibration / sound / both)
    ├── Do Not Disturb period
    ├── White noise volume controls
    └── Extra focus mode toggle
```

### Tag Management Modal

Tag management is accessed exclusively through the Timer screen tag selector. Tapping a manage/edit button inside the tag selector opens a semi-transparent modal overlay. The modal does not navigate away from the Timer screen — it floats above it.

```
Timer Screen (behind, dimmed)
└── Tag Management Modal (semi-transparent overlay)
    ├── Tag list
    │   └── Each row: color dot · name · default duration · [Edit] [Delete]
    └── [+ New Tag] button
        └── Inline form: name input · color picker · default duration
```

The modal closes on outside tap or explicit dismiss. Changes are immediately reflected in the tag selector beneath.

## Implementation Contract

### Timer Behavior

- The timer screen shows a countdown. No pause button is visible.
- Long-pressing anywhere on the screen for 5 continuous seconds triggers abandon: the session is recorded with `abandoned = true` and duration equal to elapsed time.
- When the timer reaches zero in normal mode: audio plays and/or haptic fires, session is recorded with `abandoned = false`.
- When extra focus mode is enabled and timer reaches zero: no audio/haptic, timer display switches to counting up (extra minutes), recording continues. A single tap anywhere on the screen stops the session and records `extra_minutes = elapsed_seconds_past_zero / 60`.

### Session Data Shape

Sessions table columns: id (UUID PK), tag_id (UUID NOT NULL), task_id (UUID NOT NULL ? free-focus task if no real task selected), duration (INTEGER minutes planned), actual_seconds (INTEGER real elapsed), extra_minutes (INTEGER default 0), abandoned (BOOLEAN default false), started_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ), deleted_at (TIMESTAMPTZ nullable).

### Sync Protocol

- Every table (tags, tasks, sessions, settings) has `updated_at` and `deleted_at`.
- `last_synced_at` is stored per-device in AsyncStorage.
- On app foreground or network reconnect: push local changes, pull remote changes, update `last_synced_at`.
- A row is "modified locally" if its `updated_at > last_synced_at` in the local SQLite copy.
- Conflict rule: if both local and remote have changes to the same row, the row with the larger `updated_at` is kept; the other is discarded without merge.

### Duration Resolution (observable behavior)

- global_duration=25, tag.default_duration=30, task.custom_duration=NULL ? session starts at 30 minutes
- global_duration=25, tag.default_duration=NULL, task.custom_duration=45 ? session starts at 45 minutes
- global_duration=25, tag.default_duration=NULL, task.custom_duration=NULL ? session starts at 25 minutes
- global_duration=25, tag.default_duration=30, task.custom_duration=45 ? session starts at 45 minutes (task overrides tag)

### Acceptance Criteria

- Timer long-press test: hold 4.9 seconds ? nothing happens. Hold 5.0 seconds ? session recorded as abandoned.
- Extra focus mode test: enable mode, start 1-minute timer, let expire ? no sound/haptic, counter switches upward, tap ? session has extra_minutes > 0.
- Sync test: create task offline ? task persists on restart. Restore network ? task appears in Supabase within 30 seconds of reconnect.
- Duration resolution test: tag default = 30, no task override ? timer starts at 30 minutes.
- Duration resolution test: tag default = 30, task override = 45 ? timer starts at 45 minutes.

### Scope Boundaries

**In scope:** Timer, tasks, tags, white noise, statistics, settings, Supabase auth and sync.

**Out of scope:** Push notifications from server, real-time multi-device live sync (pull-on-reconnect only), task sharing, data export.

## Risks / Trade-offs

- [Risk] Expo Managed Workflow limits on background audio ? Mitigation: configure expo-av audio session with staysActiveInBackground: true and test on physical device before shipping
- [Risk] Supabase free tier row limits at scale ? Mitigation: soft deletes accumulate rows; add a periodic hard-delete job for rows with deleted_at older than 90 days once user base grows
- [Risk] LWW sync overwrites valid user changes on multi-device use ? Mitigation: acceptable trade-off for v1 given single-user, single-primary-device usage pattern; revisit if user feedback surfaces data loss
- [Risk] SQLite schema migrations on app update ? Mitigation: use expo-sqlite with versioned migration scripts from day one; never alter columns, only add

