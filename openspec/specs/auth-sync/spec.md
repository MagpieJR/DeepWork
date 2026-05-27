# auth-sync Specification

## Purpose

TBD - created by archiving change 'deepwork-app-initial-architecture'. Update Purpose after archive.

## Requirements

### Requirement: Authentication via Supabase Auth

The system SHALL support user authentication through three providers: Google OAuth, Apple OAuth, and Email with password. The system SHALL use Supabase Auth as the authentication backend. Authentication is required to use the app — unauthenticated users SHALL NOT access any screen beyond the login screen. Upon successful authentication, the user SHALL be navigated to the Settings screen. The user's data SHALL be associated with their account identifier and available across devices after sync.

#### Scenario: Google sign-in

- **WHEN** user selects Sign in with Google and completes the OAuth flow
- **THEN** user is authenticated and navigated to the Settings screen

#### Scenario: Email sign-in

- **WHEN** user provides a valid email and password and submits
- **THEN** user is authenticated if credentials are correct and navigated to the Settings screen; an error message is shown if credentials are invalid

#### Scenario: Unauthenticated access blocked

- **WHEN** user opens the app without an active session
- **THEN** the system SHALL display the login screen and SHALL NOT allow navigation to any other screen

#### Scenario: Post-login redirect to Settings

- **WHEN** user successfully authenticates for the first time or after signing out
- **THEN** the app navigates to the Settings screen as the landing destination


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
### Requirement: Offline-first local persistence

The system SHALL use Expo SQLite as the local database. All user data including tags, tasks, sessions, and settings SHALL be written to SQLite first before any network operation. The app SHALL be fully functional without a network connection. No user-facing operation SHALL be blocked waiting for Supabase to respond.

#### Scenario: Create task offline

- **WHEN** user creates a task with no network connection
- **THEN** task is saved to SQLite immediately and visible in the task list

#### Scenario: App restart while offline

- **WHEN** app is closed and reopened with no network connection
- **THEN** all previously created data is available from local SQLite without any loading delay


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
### Requirement: Background sync on network reconnect

The system SHALL detect network reconnection and initiate a sync operation automatically. The sync SHALL push all locally modified rows where updated_at is greater than last_synced_at to Supabase, and pull all remotely modified rows where updated_at is greater than last_synced_at. After successful sync, last_synced_at SHALL be updated to the current timestamp. The sync operation SHALL run in the background without blocking any UI interaction.

#### Scenario: Sync triggered on network restore

- **WHEN** network becomes available after an offline period
- **THEN** the app begins syncing within 30 seconds without requiring any user action

#### Scenario: Sync does not block UI

- **WHEN** sync is in progress
- **THEN** all app screens remain responsive and interactive


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
### Requirement: Last-Write-Wins conflict resolution

When both a local row and its remote counterpart have been modified since the last sync, the system SHALL keep the version with the larger updated_at timestamp and discard the other version. The winning version SHALL be written to both local SQLite and Supabase after resolution. In the case of equal timestamps, the local version SHALL win.

#### Scenario: Remote wins conflict

- **WHEN** local row has updated_at of 14:03 and remote row has updated_at of 14:05 for the same record
- **THEN** the remote version is applied locally and the local version is discarded

#### Scenario: Local wins conflict

- **WHEN** local row has updated_at of 14:07 and remote row has updated_at of 14:05 for the same record
- **THEN** the local version is pushed to Supabase and the remote version is overwritten

##### Example: LWW resolution outcomes

| Local updated_at | Remote updated_at | Winner |
|------------------|-------------------|--------|
| 14:03            | 14:05             | Remote |
| 14:07            | 14:05             | Local  |
| 14:05            | 14:05             | Local  |


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
### Requirement: Soft delete

The system SHALL NOT perform hard DELETE operations on any user data row. Deleting a record SHALL set its deleted_at column to the current timestamp. Rows with a non-NULL deleted_at SHALL be excluded from all application queries. Soft-deleted rows SHALL be included in sync operations so that deletions propagate to all user devices.

#### Scenario: Delete task

- **WHEN** user deletes a task
- **THEN** the task row has deleted_at set to the current time, disappears from the task list, and is invisible in all subsequent queries

#### Scenario: Deletion propagates on sync

- **WHEN** a task is soft-deleted on device A and sync runs on device B
- **THEN** device B sets deleted_at on that task row and removes it from the task list

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