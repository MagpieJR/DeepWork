# tag-system Specification

## Purpose

TBD - created by archiving change 'deepwork-app-initial-architecture'. Update Purpose after archive.

## Requirements

### Requirement: Tag management via modal

All tag management — creation, editing, and deletion — SHALL be accessible through a semi-transparent modal overlay launched from the tag selector on the Timer screen. The modal SHALL allow the user to view all tags, create a new tag, edit an existing tag's name, color, and default duration, and delete a tag. The tag selector SHALL include a clearly visible entry point to open this modal (e.g., a manage or edit button).

#### Scenario: Open tag management modal

- **WHEN** user taps the manage button in the Timer screen tag selector
- **THEN** a semi-transparent modal overlay appears showing the full tag list with options to add, edit, and delete

#### Scenario: Close modal

- **WHEN** user taps outside the modal or taps a dismiss control
- **THEN** the modal closes and the Timer screen tag selector reflects any changes made


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
### Requirement: Tag creation and customization

The system SHALL allow the user to create tags with a name and a color. Tag names SHALL be unique across all tags. The system SHALL allow editing a tag's name, color, and default duration after creation. The system SHALL NOT allow deleting a tag that has associated tasks or sessions.

#### Scenario: Create tag

- **WHEN** user provides a unique name and a color and saves inside the tag management modal
- **THEN** new tag appears in the tag list and is immediately available for selection in the timer

#### Scenario: Duplicate tag name

- **WHEN** user attempts to save a tag with a name identical to an existing tag
- **THEN** the system SHALL block saving and display a uniqueness error

#### Scenario: Delete tag with tasks

- **WHEN** user attempts to delete a tag that has one or more tasks or sessions
- **THEN** the system SHALL block deletion and display a message listing the dependency


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
### Requirement: Tag default pomodoro duration

Each tag SHALL carry an optional default pomodoro duration in minutes. When set, this duration is used as the fallback when a task bound to this tag does not specify its own custom duration.

#### Scenario: Tag duration fallback

- **WHEN** user starts a session for a task with no custom duration and the task's tag has a default duration of 30 minutes
- **THEN** the session starts with a 30-minute countdown


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
### Requirement: Duration priority resolution

The system SHALL resolve the session duration at start time using the following priority chain: task custom duration takes highest priority, then tag default duration, then global default duration as lowest priority. The resolved duration SHALL be stored on the session record and SHALL NOT be recalculated after the session starts. Historical session records are unaffected by subsequent changes to tag or global duration settings.

#### Scenario: Task duration overrides tag

- **WHEN** a session starts for a task with custom_duration set
- **THEN** the session uses the task's custom_duration regardless of tag or global settings

#### Scenario: Task and tag both have duration set

- **WHEN** a session starts for a task with custom_duration of 45 minutes and its tag has default_duration of 30 minutes
- **THEN** the session starts with 45 minutes; the tag's default_duration is ignored

##### Example: resolution chain

| task.custom_duration | tag.default_duration | settings.global_duration | Session duration |
|----------------------|----------------------|--------------------------|-----------------|
| 45                   | 30                   | 25                       | 45              |
| NULL                 | 30                   | 25                       | 30              |
| NULL                 | NULL                 | 25                       | 25              |


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
### Requirement: Free-focus slot per tag

The system SHALL automatically create a built-in free-focus task for every tag at tag creation time. This free-focus task SHALL NOT appear in any task list screen. Sessions started from the timer screen with only a tag selected and no task SHALL be attributed to that tag's free-focus task. The free-focus task SHALL appear in statistics as a distinct entry labeled "Free Focus" under its tag.

#### Scenario: Timer started with tag only

- **WHEN** user selects a tag on the timer screen without selecting a task and starts a session
- **THEN** the session is recorded with task_id set to the tag's free-focus task identifier

#### Scenario: Free-focus in statistics

- **WHEN** user views statistics for a tag
- **THEN** sessions attributed to the free-focus task appear as a "Free Focus" row distinct from named tasks

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