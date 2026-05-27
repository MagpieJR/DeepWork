# task-management Specification

## Purpose

TBD - created by archiving change 'deepwork-app-initial-architecture'. Update Purpose after archive.

## Requirements

### Requirement: Task type daily

A daily task SHALL reset its completion state each day at 12:00 in the user's local timezone. The task SHALL support an optional estimated duration in minutes for reminder purposes only; this duration is not enforced. If a daily task is incomplete at reset time, the system SHALL mark it as missed for that day before resetting it for the new day.

#### Scenario: Daily reset at noon

- **WHEN** local clock passes 12:00 on a new day
- **THEN** all daily tasks have their completion state reset to incomplete

#### Scenario: Incomplete daily task at reset

- **WHEN** a daily task is not completed before 12:00
- **THEN** the system marks it as missed for the previous day before resetting


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
### Requirement: Task type scheduled

A scheduled task SHALL have a required date and time. The task SHALL NOT reset automatically. If a scheduled task is incomplete past its scheduled time, the system SHALL prompt the user to move it to another time or mark it as incomplete.

#### Scenario: Scheduled task past due

- **WHEN** current time passes a scheduled task's required time and the task is incomplete
- **THEN** the system SHALL prompt the user: move to another time or mark incomplete

#### Scenario: Scheduled task reminder

- **WHEN** current time equals a scheduled task's required time
- **THEN** the system SHALL deliver a strong notification using sound and haptic


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
### Requirement: Task type weekly

A weekly task SHALL reset its completion state every Sunday at midnight in the user's local timezone. The task SHALL support an optional reminder specifying a day of the week and a time for reminder purposes only. If a weekly task is incomplete at Sunday reset, the system SHALL prompt the user to move it to a specific day in the new week.

#### Scenario: Weekly reset on Sunday

- **WHEN** Sunday midnight arrives in the user's local timezone
- **THEN** all weekly tasks have their completion state reset to incomplete

#### Scenario: Incomplete weekly task at reset

- **WHEN** a weekly task is incomplete at Sunday reset
- **THEN** the system SHALL ask the user which day in the new week to reschedule it to


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
### Requirement: Tag binding requirement for tasks

Every task SHALL be bound to exactly one tag at creation time. The system SHALL NOT allow saving a task without a tag selection. A task's tag MAY be changed after creation.

#### Scenario: Task creation without tag

- **WHEN** user attempts to save a new task without selecting a tag
- **THEN** the system SHALL block saving and display an error message requiring a tag

#### Scenario: Tag change on existing task

- **WHEN** user edits a task and changes its tag
- **THEN** the task is saved with the new tag; existing session records retain the original tag_id from those sessions


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
### Requirement: Task completion toggle

A task SHALL support a manual completion toggle. Completing a task does not end any running session. A completed task MAY be re-opened before the next reset.

#### Scenario: Mark task complete

- **WHEN** user toggles a task to completed
- **THEN** task displays as completed and is excluded from active task count

#### Scenario: Undo task completion

- **WHEN** user toggles a completed task back to incomplete before reset
- **THEN** task returns to incomplete state

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