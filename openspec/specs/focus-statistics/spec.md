# focus-statistics Specification

## Purpose

TBD - created by archiving change 'deepwork-app-initial-architecture'. Update Purpose after archive.

## Requirements

### Requirement: Today and week view toggle

The statistics screen SHALL provide a toggle to switch between a Today view and a This Week view. Today view SHALL display data from midnight to the current time in the user's local timezone. This Week view SHALL display data from the most recent Monday at midnight to the current moment.

#### Scenario: Switch to today view

- **WHEN** user selects the Today toggle
- **THEN** statistics reflect only sessions that started on the current calendar day in local time

#### Scenario: Switch to week view

- **WHEN** user selects the This Week toggle
- **THEN** statistics reflect sessions from Monday 00:00 local time through the current moment


<!-- @trace
source: deepwork-app-initial-architecture
updated: 2026-05-28
code:
  - app/src/navigation/MainNavigator.tsx
  - app/src/db/database.ts
  - app/src/screens/SettingsScreen.tsx
  - app/src/stores/taskStore.ts
  - app/src/components/VolumeControls.tsx
  - app/package.json
  - package.json
  - app/src/stores/audioStore.ts
  - app/.env.example
  - app/src/db/helpers.ts
  - app/assets/audio/cafe.mp3
  - app/src/services/supabase.ts
  - app/src/stores/statsStore.ts
  - app/src/db/schema.ts
  - app/src/screens/StatisticsScreen.tsx
  - app/src/screens/LoginScreen.tsx
  - app/src/screens/TimerScreen.tsx
  - app/src/stores/tagStore.ts
  - app/App.tsx
  - app/src/components/TagManagerModal.tsx
  - app/src/stores/settingsStore.ts
  - app/src/services/sync.ts
  - app/src/stores/timerStore.ts
  - app/assets/audio/forest.mp3
  - app/assets/audio/ocean.mp3
  - app/src/theme/index.ts
  - app/assets/audio/rain.mp3
  - app/src/navigation/RootNavigator.tsx
  - app/src/screens/TasksScreen.tsx
  - app/assets/audio/whitenoise.mp3
-->

---
### Requirement: Summary block

The statistics screen SHALL display a summary block containing three values side by side: completed session count, abandoned session count, and total extra focus minutes. These three values SHALL appear together in a single visual group. Completed and abandoned counts SHALL be visually differentiated using distinct colors or icons. Extra focus minutes from abandoned sessions SHALL be excluded from the extra focus total.

#### Scenario: Summary block displays all three values

- **WHEN** user views statistics for a period with both completed and abandoned sessions and extra focus minutes
- **THEN** the summary block shows completed count, abandoned count, and extra focus minutes together in one section

#### Scenario: Extra focus total excludes abandoned sessions

- **WHEN** user views Today statistics after two completed sessions with extra_minutes of 3 and 7, and one abandoned session with extra_minutes of 5
- **THEN** the summary block shows extra focus total of 10 minutes (abandoned session excluded)


<!-- @trace
source: deepwork-app-initial-architecture
updated: 2026-05-28
code:
  - app/src/navigation/MainNavigator.tsx
  - app/src/db/database.ts
  - app/src/screens/SettingsScreen.tsx
  - app/src/stores/taskStore.ts
  - app/src/components/VolumeControls.tsx
  - app/package.json
  - package.json
  - app/src/stores/audioStore.ts
  - app/.env.example
  - app/src/db/helpers.ts
  - app/assets/audio/cafe.mp3
  - app/src/services/supabase.ts
  - app/src/stores/statsStore.ts
  - app/src/db/schema.ts
  - app/src/screens/StatisticsScreen.tsx
  - app/src/screens/LoginScreen.tsx
  - app/src/screens/TimerScreen.tsx
  - app/src/stores/tagStore.ts
  - app/App.tsx
  - app/src/components/TagManagerModal.tsx
  - app/src/stores/settingsStore.ts
  - app/src/services/sync.ts
  - app/src/stores/timerStore.ts
  - app/assets/audio/forest.mp3
  - app/assets/audio/ocean.mp3
  - app/src/theme/index.ts
  - app/assets/audio/rain.mp3
  - app/src/navigation/RootNavigator.tsx
  - app/src/screens/TasksScreen.tsx
  - app/assets/audio/whitenoise.mp3
-->

---
### Requirement: Session breakdown with tag and task tabs

The statistics screen SHALL display a session breakdown section below the summary block. This section SHALL have two tabs: a Tag tab and a Task tab.

In the Tag tab, completed session counts SHALL be grouped by tag; each tag shows its total completed sessions across all its tasks combined.

In the Task tab, all tasks that have at least one completed session in the selected period SHALL be listed individually with their completed session count. Tasks with zero sessions SHALL be hidden. The free-focus slot SHALL appear as a "Free Focus" entry.

#### Scenario: Tag tab groups by tag

- **WHEN** user selects the Tag tab in the breakdown section
- **THEN** each tag appears as a row showing the tag name and total completed sessions for that tag in the selected period

#### Scenario: Task tab lists individual tasks

- **WHEN** user selects the Task tab in the breakdown section
- **THEN** each task with at least one completed session appears as a row showing the task name and its completed session count

#### Scenario: Zero-session tasks hidden in task tab

- **WHEN** a task has no completed sessions in the selected period
- **THEN** that task does not appear in the Task tab list

<!-- @trace
source: deepwork-app-initial-architecture
updated: 2026-05-28
code:
  - app/src/navigation/MainNavigator.tsx
  - app/src/db/database.ts
  - app/src/screens/SettingsScreen.tsx
  - app/src/stores/taskStore.ts
  - app/src/components/VolumeControls.tsx
  - app/package.json
  - package.json
  - app/src/stores/audioStore.ts
  - app/.env.example
  - app/src/db/helpers.ts
  - app/assets/audio/cafe.mp3
  - app/src/services/supabase.ts
  - app/src/stores/statsStore.ts
  - app/src/db/schema.ts
  - app/src/screens/StatisticsScreen.tsx
  - app/src/screens/LoginScreen.tsx
  - app/src/screens/TimerScreen.tsx
  - app/src/stores/tagStore.ts
  - app/App.tsx
  - app/src/components/TagManagerModal.tsx
  - app/src/stores/settingsStore.ts
  - app/src/services/sync.ts
  - app/src/stores/timerStore.ts
  - app/assets/audio/forest.mp3
  - app/assets/audio/ocean.mp3
  - app/src/theme/index.ts
  - app/assets/audio/rain.mp3
  - app/src/navigation/RootNavigator.tsx
  - app/src/screens/TasksScreen.tsx
  - app/assets/audio/whitenoise.mp3
-->