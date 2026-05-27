## ADDED Requirements

### Requirement: Timer start with optional binding

The system SHALL allow the user to start a focus session from the timer screen or from the task screen. The screen from which the session was started SHALL be recorded as the origin screen. Before starting, the user MAY select a tag only, a tag and a task, or start with no selection. If a tag is selected without a task, the session SHALL be attributed to the tag's built-in free-focus task. If no tag is selected, the system SHALL use the most recently used tag as the default selection. The system SHALL NOT allow starting a session without any tag selection.

#### Scenario: Start with tag only

- **WHEN** user selects a tag but no task and taps Start
- **THEN** a session begins attributed to that tag's free-focus task

#### Scenario: Start with tag and task

- **WHEN** user selects a tag and a specific task and taps Start
- **THEN** a session begins attributed to that task

#### Scenario: Start with no tag

- **WHEN** user attempts to start without selecting a tag
- **THEN** the system SHALL prompt the user to select a tag before proceeding

### Requirement: Timer countdown display

The system SHALL display a countdown timer showing remaining minutes and seconds. The timer SHALL update every second. No pause button SHALL be visible during an active session.

#### Scenario: Active countdown

- **WHEN** a session is running
- **THEN** the display shows MM:SS counting down and no pause or stop control is visible

### Requirement: Long-press abandon

The system SHALL allow the user to abandon a running session by performing a continuous long-press gesture for 5 seconds anywhere on the timer screen. If the user releases before 5 seconds, the abandon SHALL be cancelled with no effect. On successful abandon, the session SHALL be recorded with abandoned equal to true and actual_seconds equal to elapsed time.

#### Scenario: Incomplete long-press

- **WHEN** user presses and holds for 4.9 seconds then releases
- **THEN** session continues running with no change

#### Scenario: Complete long-press abandon

- **WHEN** user presses and holds for exactly 5.0 continuous seconds
- **THEN** session ends, recorded as abandoned with actual elapsed seconds

##### Example: abandon timing threshold

| Hold duration | Result                          |
|---------------|---------------------------------|
| 4.9 seconds   | No effect, session continues    |
| 5.0 seconds   | Session abandoned and recorded  |
| 6.0 seconds   | Session abandoned and recorded  |

### Requirement: Post-abandon navigation

After a session is abandoned via long-press, the system SHALL navigate back to the origin screen: if the session was started from the Timer screen the user SHALL be returned to the Timer screen; if started from the Task screen the user SHALL be returned to the Task screen.

#### Scenario: Abandon from timer screen returns to timer

- **WHEN** user started a session from the Timer screen and completes a long-press abandon
- **THEN** app navigates back to the Timer screen

#### Scenario: Abandon from task screen returns to tasks

- **WHEN** user started a session from the Task screen and completes a long-press abandon
- **THEN** app navigates back to the Task screen

### Requirement: Normal session completion

When the timer countdown reaches zero with extra focus mode disabled, the system SHALL end the session, play a completion sound and/or haptic feedback according to the user's notification settings, and record the session with abandoned equal to false and extra_minutes equal to 0. The system SHALL then display a Completion screen.

#### Scenario: Timer expires in normal mode

- **WHEN** countdown reaches zero and extra focus mode is OFF
- **THEN** completion audio and haptic fire, session is saved as completed, Completion screen is shown

#### Scenario: User dismisses completion screen

- **WHEN** user taps anywhere on the Completion screen
- **THEN** app navigates to the origin screen (Timer screen if started from timer, Task screen if started from tasks)

### Requirement: Extra focus mode silent continuation

When extra focus mode is enabled globally and the timer countdown reaches zero, the system SHALL NOT play any sound or trigger any haptic. The timer display SHALL switch from countdown to counting up elapsed extra time. The session SHALL remain active until the user taps once anywhere on the screen. After the tap, the system SHALL display the Completion screen showing the extra minutes accumulated. A second tap on the Completion screen SHALL navigate to the origin screen.

#### Scenario: Timer expires with extra focus mode ON

- **WHEN** countdown reaches zero and extra focus mode is ON
- **THEN** no sound or haptic fires, display switches to upward counting, session remains active

#### Scenario: User stops extra focus session

- **WHEN** user taps once during extra focus counting
- **THEN** session ends, recorded with extra_minutes equal to seconds elapsed past zero divided by 60 rounded down, abandoned equal to false, and Completion screen is shown displaying the extra minutes

#### Scenario: User dismisses completion screen after extra focus

- **WHEN** user taps the Completion screen after an extra focus session
- **THEN** app navigates to the origin screen

##### Example: extra minutes calculation

| Seconds past zero | extra_minutes recorded |
|-------------------|------------------------|
| 59                | 0                      |
| 60                | 1                      |
| 150               | 2                      |
| 180               | 3                      |
