## ADDED Requirements

### Requirement: Five ambient audio tracks

The system SHALL provide exactly five ambient audio tracks: Rain, Cafe, Ocean, Forest, and White Noise. Each track SHALL be a looping audio file bundled with the application. No network connection SHALL be required to play any track.

#### Scenario: Track playback

- **WHEN** user enables a track
- **THEN** the track plays in a continuous loop until disabled or the focus session ends

### Requirement: Independent per-track volume control

Each of the five tracks SHALL have an independent volume slider. Volume SHALL be adjustable from 0 to 100. Changing one track's volume SHALL NOT affect any other track's volume. A track with volume set to 0 SHALL stop playing and SHALL NOT consume audio resources.

#### Scenario: Independent volume adjustment

- **WHEN** user sets Rain volume to 80 and Cafe volume to 40
- **THEN** Rain plays at 80 percent volume and Cafe plays at 40 percent volume simultaneously with no effect on each other

#### Scenario: Track silenced at zero

- **WHEN** user sets a track's volume to 0
- **THEN** that track stops playing and releases its audio resource

### Requirement: Background audio during focus session

The system SHALL continue playing selected ambient tracks during an active focus session even when the app is in the background or the screen is locked. Audio playback SHALL stop automatically when the focus session ends by completion or abandon.

#### Scenario: App backgrounded during session

- **WHEN** user switches to another app during an active focus session with audio playing
- **THEN** ambient audio continues uninterrupted in the background

#### Scenario: Session end stops audio

- **WHEN** a focus session completes or is abandoned
- **THEN** all ambient audio playback stops immediately

### Requirement: Volume control accessible from timer and settings screens

The ambient audio volume controls SHALL be accessible from both the timer screen for in-session adjustment and the settings screen for default configuration outside of sessions. Volume values set on either screen SHALL persist and be reflected identically on the other screen.

#### Scenario: Volume adjusted on timer screen persists to settings

- **WHEN** user changes Rain volume to 60 from the timer screen
- **THEN** the settings screen also displays Rain volume as 60
