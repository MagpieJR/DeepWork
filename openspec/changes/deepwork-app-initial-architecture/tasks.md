<!--
Each task description MUST state:
- the behavior or contract being delivered (what is observably true when the
  task is complete), and
- the verification target that proves completion (test, CLI invocation,
  analyzer check, manual assertion, or content review).

File paths are supporting context for locating the work, never the task
itself. "Edit file X" is not a valid task — it is missing both behavior and
verification.
-->

## 1. Project Setup and Navigation Structure

- [x] 1.1 Initialize project using Expo Managed Workflow over Bare React Native (per design decision): run `npx create-expo-app` with TypeScript template; verify the app launches on Expo Go on a physical device and shows the default screen
- [x] 1.2 Install core dependencies following Zustand for State Management decision: React Navigation v6, Zustand, expo-sqlite, expo-av, expo-notifications, @supabase/supabase-js, react-native-gesture-handler; verify no install errors and app still launches
- [x] 1.3 Implement Navigation Structure: configure a bottom tab navigator with four tabs — Timer, Tasks, Statistics, Settings — each with a placeholder screen; verify all four tabs are tappable and switch screens without errors
- [x] 1.4 Configure expo-av audio session with staysActiveInBackground set to true in app.json so that background audio during focus session is supported; verify audio continues when app is backgrounded on a physical device

## 2. Local Database Schema

- [ ] 2.1 Implement offline-first local persistence using the session data shape from design: create the SQLite schema with tables for tags, tasks, sessions, and settings; every table MUST include id (UUID), updated_at (timestamp), and deleted_at (timestamp nullable) columns; verify schema creates without errors on first app launch
- [ ] 2.2 Implement soft delete: write a deleteRecord helper that sets deleted_at to the current timestamp instead of issuing DELETE; verify that calling deleteRecord on a task sets its deleted_at and the task no longer appears in list queries
- [ ] 2.3 Implement versioned migration system: create a migrations table and a runMigrations function that applies schema changes in order on app start; verify that adding a new migration in development applies correctly without data loss
- [ ] 2.4 Write a query helper that automatically filters out rows where deleted_at is not NULL for all reads; verify that soft-deleted records are excluded from all list and detail queries

## 3. Tag System

- [ ] 3.1 Implement tag creation and customization: the user can create a tag with a name and color; duplicate names are rejected with an error; verify by attempting to create two tags with the same name and confirming the second is blocked
- [ ] 3.2 Implement free-focus slot per tag: on tag creation, automatically insert a free-focus task record linked to that tag with a system flag; verify the free-focus task exists in the database after tag creation and does not appear in any task list screen
- [ ] 3.3 Implement tag default pomodoro duration: tags store an optional default_duration integer; the edit tag screen exposes this field; verify saving a tag with default_duration = 30 persists correctly and is readable
- [ ] 3.4 Implement Duration Resolution (observable behavior) — duration priority resolution at session start: the session start function resolves duration using the chain task.custom_duration ?? tag.default_duration ?? settings.global_duration; verify all three cases from the resolution chain example in the tag-system spec produce the correct session duration

## 4. Task Management

- [ ] 4.1 Implement tag binding requirement for tasks: the task creation form requires a tag selection before saving; the Save button is disabled and shows an error if no tag is selected; verify attempting to save without a tag displays the error and does not create the task
- [ ] 4.2 Implement task type daily: daily tasks display in the Daily tab; their completion state resets at 12:00 local time each day; incomplete tasks at reset are marked as missed; verify by setting a device clock past 12:00 and confirming reset occurs
- [ ] 4.3 Implement task type scheduled: scheduled tasks require a date and time; when the scheduled time passes and the task is incomplete, the app prompts the user to move it or mark it incomplete; verify by creating a scheduled task in the past and confirming the prompt appears
- [ ] 4.4 Implement task type weekly: weekly tasks reset every Sunday at midnight local time; incomplete tasks at reset prompt the user to pick a day in the new week; verify by simulating Sunday midnight and confirming the prompt and reset behavior
- [ ] 4.5 Implement task completion toggle: tapping a task marks it complete and removes it from the active count; tapping again before reset returns it to incomplete; verify both toggle directions on all three task types

## 5. Focus Timer

- [ ] 5.1 Implement timer start with optional binding applying the Tag-Only Timer Sessions and Free-Focus Slot design decision: the timer screen shows a tag picker and optional task picker; tapping Start without a tag shows an error; tapping Start with a tag only creates a session attributed to the free-focus task; verify all three start paths (no tag, tag only, tag + task) behave as specified in the focus-timer spec
- [ ] 5.2 Implement Timer Behavior — timer countdown display: the screen shows MM:SS counting down every second during an active session; no pause or stop button is visible; verify by starting a session and confirming the countdown updates and no pause control is rendered
- [ ] 5.3 Implement long-press abandon per Acceptance Criteria in design (hold 4.9 s = no effect, hold 5.0 s = abandon): a 5-second continuous long-press anywhere on the timer screen abandons the session and records it with abandoned = true and actual elapsed seconds; releasing before 5 seconds has no effect; verify using the timing threshold table in the focus-timer spec
- [ ] 5.4 Implement normal session completion: when the countdown reaches zero with extra focus mode OFF, the session is saved as completed, completion audio and haptic fire per notification settings, and the screen returns to idle; verify by running a short test timer and confirming session record and audio/haptic
- [ ] 5.5 Implement extra focus mode silent continuation: when extra focus mode is ON and the timer reaches zero, no audio or haptic fires, the display switches to counting up, and a single tap stops the session recording extra_minutes as floor(seconds_past_zero / 60); verify using the example table in the focus-timer spec (59 s = 0, 60 s = 1, 150 s = 2)

## 6. White Noise

- [ ] 6.1 Implement five ambient audio tracks: bundle Rain, Cafe, Ocean, Forest, and White Noise audio files; each loops continuously when enabled; no network connection is required; verify all five tracks play offline on a device with airplane mode enabled
- [ ] 6.2 Implement independent per-track volume control: each track has its own volume slider from 0 to 100; adjusting one track does not affect others; a track at volume 0 stops playing and releases resources; verify by setting two tracks to different volumes and confirming independent behavior
- [ ] 6.3 Implement background audio during focus session: ambient tracks continue playing when the app is backgrounded during an active session; audio stops when the session ends by completion or abandon; verify on a physical device by backgrounding the app and confirming audio continues, then completing the session and confirming audio stops
- [ ] 6.4 Implement volume control accessible from timer and settings screens: both screens expose the same volume sliders; changing volume on either screen updates the shared Zustand audio store and persists; verify that setting Rain to 60 on the timer screen shows 60 on the settings screen without restart

## 7. Focus Statistics

- [ ] 7.1 Implement today and week view toggle: the statistics screen has a toggle switching between Today (midnight to now local) and This Week (Monday 00:00 to now local); verify that creating sessions on different days only appears in the correct view
- [ ] 7.2 Implement completed and abandoned pomodoro counts: the screen shows separate counters for completed and abandoned sessions in the selected period, visually differentiated; verify by recording both session types and confirming each counter increments correctly
- [ ] 7.3 Implement extra focus minutes total: the screen shows total extra_minutes from non-abandoned sessions in the period; abandoned session extra minutes are excluded; verify using the scenario in the focus-statistics spec (two sessions with 3 and 7 extra minutes shows total of 10)
- [ ] 7.4 Implement per-task session breakdown: the screen shows completed session counts grouped by tag with tasks nested under each tag; the free-focus slot appears as "Free Focus"; tasks with zero sessions in the period are hidden; verify by checking that a task with no sessions does not appear in the list

## 8. Settings

- [ ] 8.1 Implement global pomodoro duration setting: the settings screen exposes a numeric input for the global default duration in minutes; saving updates the global setting used as the lowest priority in the duration resolution chain; verify that changing global duration affects new sessions when no tag or task override is set
- [ ] 8.2 Implement notification settings: the settings screen allows choosing between vibration only, sound only, or both for session completion; the selected mode is stored and applied when normal session completion fires; verify each notification mode fires the correct feedback type
- [ ] 8.3 Implement extra focus mode toggle: the settings screen and the statistics screen each expose the extra focus mode global toggle; toggling either updates the shared state; verify that enabling via settings causes the timer to enter silent continuation mode on expiry

## 9. Authentication and Sync

- [ ] 9.1 Implement Authentication via Supabase Auth using Supabase over Firebase (per design decision): the app provides sign-in with Google, Apple, and Email/Password; unauthenticated users can use the app with local storage only; verify each provider completes the sign-in flow and returns an authenticated session
- [ ] 9.2 Implement Background sync on network reconnect: apply Offline-First with Last-Write-Wins Sync following the Sync Protocol defined in design; on network restore, push rows where local updated_at > last_synced_at and pull remote rows where updated_at > last_synced_at; last_synced_at is updated after successful sync; sync runs without blocking the UI; verify by creating data offline, restoring network, and confirming rows appear in Supabase within 30 seconds; Scope Boundaries: push/pull on reconnect only, no live real-time streaming
- [ ] 9.3 Implement Last-Write-Wins conflict resolution: when a local and remote row for the same id both have updated_at > last_synced_at, the row with the larger updated_at wins; equal timestamps resolve to local winning; verify using the LWW resolution table in the auth-sync spec (three cases: remote wins, local wins, tie goes to local)
- [ ] 9.4 Implement deletion propagation via soft delete sync: soft-deleted rows (deleted_at set) are included in the sync push; on the receiving device, pulling a row with deleted_at set causes the local row to be soft-deleted and removed from all queries; verify by deleting a task on device A, syncing, and confirming it disappears on device B
