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

- [x] 2.1 Implement offline-first local persistence using the session data shape from design: create the SQLite schema with tables for tags, tasks, sessions, and settings; every table MUST include id (UUID), updated_at (timestamp), and deleted_at (timestamp nullable) columns; verify schema creates without errors on first app launch
- [x] 2.2 Implement soft delete: write a deleteRecord helper that sets deleted_at to the current timestamp instead of issuing DELETE; verify that calling deleteRecord on a task sets its deleted_at and the task no longer appears in list queries
- [x] 2.3 Implement versioned migration system: create a migrations table and a runMigrations function that applies schema changes in order on app start; verify that adding a new migration in development applies correctly without data loss
- [x] 2.4 Write a query helper that automatically filters out rows where deleted_at is not NULL for all reads; verify that soft-deleted records are excluded from all list and detail queries

## 3. Tag System

- [x] 3.1 Implement tag creation and customization: the user can create a tag with a name and color; duplicate names are rejected with an error; verify by attempting to create two tags with the same name and confirming the second is blocked
- [x] 3.2 Implement free-focus slot per tag: on tag creation, automatically insert a free-focus task record linked to that tag with a system flag; verify the free-focus task exists in the database after tag creation and does not appear in any task list screen
- [x] 3.3 Implement tag default pomodoro duration: tags store an optional default_duration integer; the edit tag screen exposes this field; verify saving a tag with default_duration = 30 persists correctly and is readable
- [x] 3.4 Implement Duration Resolution (observable behavior) — duration priority resolution at session start: the session start function resolves duration using the chain task.custom_duration ?? tag.default_duration ?? settings.global_duration; verify all three cases from the resolution chain example in the tag-system spec produce the correct session duration

## 4. Task Management

- [x] 4.1 Implement tag binding requirement for tasks: the task creation form requires a tag selection before saving; the Save button is disabled and shows an error if no tag is selected; verify attempting to save without a tag displays the error and does not create the task
- [x] 4.2 Implement task type daily: daily tasks display in the Daily tab; their completion state resets at 12:00 local time each day; incomplete tasks at reset are marked as missed; verify by setting a device clock past 12:00 and confirming reset occurs
- [x] 4.3 Implement task type scheduled: scheduled tasks require a date and time; when the scheduled time passes and the task is incomplete, the app prompts the user to move it or mark it incomplete; verify by creating a scheduled task in the past and confirming the prompt appears
- [x] 4.4 Implement task type weekly: weekly tasks reset every Sunday at midnight local time; incomplete tasks at reset prompt the user to pick a day in the new week; verify by simulating Sunday midnight and confirming the prompt and reset behavior
- [x] 4.5 Implement task completion toggle: tapping a task marks it complete and removes it from the active count; tapping again before reset returns it to incomplete; verify both toggle directions on all three task types

## 5. Focus Timer

- [x] 5.1 Implement timer start with optional binding applying the Tag-Only Timer Sessions and Free-Focus Slot design decision: the timer screen shows a tag picker and optional task picker; tapping Start without a tag shows an error; tapping Start with a tag only creates a session attributed to the free-focus task; verify all three start paths (no tag, tag only, tag + task) behave as specified in the focus-timer spec
- [x] 5.2 Implement Timer Behavior — timer countdown display: the screen shows MM:SS counting down every second during an active session; no pause or stop button is visible; verify by starting a session and confirming the countdown updates and no pause control is rendered
- [x] 5.3 Implement long-press abandon and post-abandon navigation per Acceptance Criteria in design (hold 4.9 s = no effect, hold 5.0 s = abandon): a 5-second continuous long-press anywhere on the timer screen abandons the session and records it with abandoned = true and actual elapsed seconds; releasing before 5 seconds has no effect; post-abandon navigation returns to the Timer tab when the session originated from the timer screen, or to the Tasks tab when originated from Tasks; verify using the timing threshold table in the focus-timer spec
- [x] 5.4 Implement normal session completion: when the countdown reaches zero with extra focus mode OFF, the session is saved as completed, completion audio and haptic fire per notification settings, and the screen returns to idle; verify by running a short test timer and confirming session record and audio/haptic
- [x] 5.5 Implement extra focus mode silent continuation: when extra focus mode is ON and the timer reaches zero, no audio or haptic fires, the display switches to counting up, and a single tap stops the session recording extra_minutes as floor(seconds_past_zero / 60); verify using the example table in the focus-timer spec (59 s = 0, 60 s = 1, 150 s = 2)

## 6. White Noise

- [x] 6.1 Implement five ambient audio tracks: bundle Rain, Cafe, Ocean, Forest, and White Noise audio files; each loops continuously when enabled; no network connection is required; verify all five tracks play offline on a device with airplane mode enabled
- [x] 6.2 Implement independent per-track volume control: each track has its own volume slider from 0 to 100; adjusting one track does not affect others; a track at volume 0 stops playing and releases resources; verify by setting two tracks to different volumes and confirming independent behavior
- [x] 6.3 Implement background audio during focus session: ambient tracks continue playing when the app is backgrounded during an active session; audio stops when the session ends by completion or abandon; verify on a physical device by backgrounding the app and confirming audio continues, then completing the session and confirming audio stops
- [x] 6.4 Implement volume control accessible from timer and settings screens: both screens expose the same volume sliders; changing volume on either screen updates the shared Zustand audio store and persists; verify that setting Rain to 60 on the timer screen shows 60 on the settings screen without restart

## 7. Focus Statistics

- [x] 7.1 Implement today and week view toggle: the statistics screen has a toggle switching between Today (midnight to now local) and This Week (Monday 00:00 to now local); verify that creating sessions on different days only appears in the correct view
- [x] 7.2 Implement Summary block with completed and abandoned pomodoro counts: the summary block shows three values — completed count, abandoned count, and extra focus minutes — for the selected period, visually differentiated; verify by recording both session types and confirming each counter in the summary block increments correctly
- [x] 7.3 Implement extra focus minutes total in the summary block: the screen shows total extra_minutes from non-abandoned sessions in the period; abandoned session extra minutes are excluded; verify using the scenario in the focus-statistics spec (two sessions with 3 and 7 extra minutes shows total of 10)
- [x] 7.4 Implement session breakdown with tag and task tabs: the breakdown section has two tabs — tag tab groups completed session counts by tag color and name; task tab lists individual tasks with their completed session counts; tasks with zero sessions in the period are hidden; the free-focus slot appears as "Free Focus" under its tag; verify by checking that a task with no sessions does not appear in the task tab

## 8. Settings

- [x] 8.1 Implement global pomodoro duration setting: the settings screen exposes a numeric input for the global default duration in minutes; saving updates the global setting used as the lowest priority in the duration resolution chain; verify that changing global duration affects new sessions when no tag or task override is set
- [x] 8.2 Implement notification settings: the settings screen allows choosing between vibration only, sound only, or both for session completion; the selected mode is stored and applied when normal session completion fires; verify each notification mode fires the correct feedback type
- [x] 8.3 Implement extra focus mode toggle: the settings screen and the statistics screen each expose the extra focus mode global toggle; toggling either updates the shared state; verify that enabling via settings causes the timer to enter silent continuation mode on expiry

## 9. Authentication and Sync

- [x] 9.1 Implement Authentication via Supabase Auth using Supabase over Firebase (per design decision): the app provides sign-in with Google, Apple, and Email/Password; unauthenticated users can use the app with local storage only; verify each provider completes the sign-in flow and returns an authenticated session
- [x] 9.2 Implement Background sync on network reconnect: apply Offline-First with Last-Write-Wins Sync following the Sync Protocol defined in design; on network restore, push rows where local updated_at > last_synced_at and pull remote rows where updated_at > last_synced_at; last_synced_at is updated after successful sync; sync runs without blocking the UI; verify by creating data offline, restoring network, and confirming rows appear in Supabase within 30 seconds; Scope Boundaries: push/pull on reconnect only, no live real-time streaming
- [x] 9.3 Implement Last-Write-Wins conflict resolution: when a local and remote row for the same id both have updated_at > last_synced_at, the row with the larger updated_at wins; equal timestamps resolve to local winning; verify using the LWW resolution table in the auth-sync spec (three cases: remote wins, local wins, tie goes to local)
- [x] 9.4 Implement deletion propagation via soft delete sync: soft-deleted rows (deleted_at set) are included in the sync push; on the receiving device, pulling a row with deleted_at set causes the local row to be soft-deleted and removed from all queries; verify by deleting a task on device A, syncing, and confirming it disappears on device B

## 10. TasksScreen Full Implementation

- [x] 10.1 Implement Daily/Scheduled/Weekly tab navigation on TasksScreen: three tabs at the top filter the task list to the selected type; the active tab shows a white underline indicator and white label; inactive tabs show muted labels; verify that switching tabs shows only tasks of that type and the indicator moves correctly
- [x] 10.2 Implement task creation form in a bottom-sheet modal: the form exposes title (required), tag selector (required — horizontal chip row with color dot), task type selector (three-way toggle), optional custom duration, date+time inputs for Scheduled type, and reminder day+time selectors for Weekly type; tapping Save with no title or no tag shows an inline error and does not create the task; verify all validation branches and that a valid form creates the task and closes the modal
- [x] 10.3 Implement task row UI: each row shows a square checkbox (filled with ice-blue #c3d9f3 when complete, with a ✓ glyph), a 3 px tag-color left-accent strip, task title (struck-through when complete), type-specific meta text (scheduled datetime for Scheduled; reminder day+time for Weekly), missed-count badge in danger red, and edit (✏) and delete (✕) icon buttons; verify all elements render correctly for a task in each of the three types
- [x] 10.4 Implement task completion toggle: tapping the checkbox calls toggleComplete, which sets is_completed = 1 or 0 in SQLite and reloads the list; completed rows render at 50% opacity with a struck-through title; verify both toggle directions persist across an app restart
- [x] 10.5 Implement past-due Scheduled task prompt: on screen mount, getPastDueScheduled is called; for each overdue incomplete Scheduled task an Alert fires with "Dismiss" and "Mark Incomplete" options; verify by creating a Scheduled task with a past datetime and confirming the Alert appears on the next screen mount

## 11. Bugatti-Inspired Design System

- [x] 11.1 Create src/theme/index.ts with all design tokens: MONO font constant (Courier New on iOS, monospace on Android), C color object (canvas #000000, surfaceCard #141414, hairline #262626, onDark #ffffff, muted #999999, accent #c3d9f3, danger #cc4444, and others), T typography presets (wordmark, displayXL/LG/MD/SM, button, caption, bodyMD/SM — all weight 400), BTN_PRIMARY shared ViewStyle (transparent background, 1 px white border, borderRadius 9999, min height 44), BTN_GHOST, CARD, and INPUT_UNDERLINE helpers; verify that importing C.canvas from src/theme returns '#000000' and MONO returns the correct platform value
- [x] 11.2 Update MainNavigator to Bugatti tab bar: background #000000, active tint #ffffff, inactive tint #999999, 1 px hairline (#262626) top border, tab labels in MONO font at 9 px with 1.5 letterSpacing and textTransform uppercase, tab icons hidden; verify all four tabs render with the new style and the active tab label is white
- [x] 11.3 Update LoginScreen: "DEEPWORK" wordmark rendered via T.wordmark (14 px MONO, letterSpacing 6, uppercase), email and password inputs use underline-only style (borderBottomWidth 1, transparent background), OAuth buttons use ghost outline pill style, primary Sign In / Create Account button uses BTN_PRIMARY; verify the screen renders with pure black background and all inputs accept text
- [x] 11.4 Update TimerScreen idle state: wordmark at top, tag and task selectors use underline-only pickers (borderBottomWidth 1), Start Session button uses BTN_PRIMARY (transparent outline pill); active session state shows phase label in T.caption, timer display in MONO at 76 px letterSpacing 6, abandon progress bar as a 1 px white-filled track on #262626 background; completed state shows T.displayLG headline; verify each of the three phases renders without layout overflow
- [x] 11.5 Update StatisticsScreen: statistics numbers rendered in MONO at 40 px letterSpacing 2, summary labels in T.caption, Today/Week and Tag/Task tabs use underline indicator style matching MainNavigator, extra focus toggle uses outline pill matching the design system, tag breakdown rows show 3 px color-accent left strip; verify numbers display correctly after recording a session
- [x] 11.6 Update SettingsScreen to match settings screen layout from design: section headers in T.caption (10 px MONO uppercase), global duration input uses MONO 20 px with underline-only border, notification type selector uses outline pill options (borderRadius 9999), extra focus toggle uses outline pill, all rows separated by 1 px hairline (#262626); verify settings persist after toggling and restarting
- [x] 11.7 Update TagManagerModal implementing the tag management via modal and tag management modal design: sheet background #141414 with 1 px hairline top border (no rounded corners), tag rows show 3 px color-accent left strip and MONO metadata, color swatches are 28×28 square (0 px radius) with 2 px white border when selected, inputs use underline-only style, New Tag and Save buttons use BTN_PRIMARY; the modal is accessed exclusively from the Timer screen tag selector via the Manage link; verify creating and editing a tag works end-to-end with the new styling
- [x] 11.8 Update VolumeControls: track labels in MONO 10 px uppercase letterSpacing 1.5, volume value in MONO 12 px, slider minimumTrackTintColor and thumbTintColor set to #ffffff, maximumTrackTintColor set to #3a3a3a; rows separated by 1 px hairline; verify slider values update the audio store in real time
