import { create } from 'zustand';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { getDb } from '../db/database';
import { generateUUID, nowISO } from '../db/helpers';
import { useTagStore } from './tagStore';
import { useTaskStore } from './taskStore';
import { useAudioStore } from './audioStore';
import { useSettingsStore } from './settingsStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TimerPhase =
  | 'idle'           // No session running
  | 'countdown'      // Counting down planned duration
  | 'extra'          // Extra-focus mode: counting up past zero
  | 'completed';     // Session ended normally, showing completion screen

export type SessionOrigin = 'Timer' | 'Tasks';

export interface Session {
  id: string;
  tag_id: string;
  task_id: string;
  duration: number;         // planned minutes
  actual_seconds: number;
  extra_minutes: number;
  abandoned: boolean;
  started_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface TimerState {
  phase: TimerPhase;

  /** Selected tag and task before/during session. */
  selectedTagId: string | null;
  selectedTaskId: string | null;  // null = free-focus slot will be used

  /** Most-recently-used tag id (pre-fills the tag picker). */
  lastUsedTagId: string | null;

  /** The session currently running (if phase !== 'idle'). */
  activeSessionId: string | null;
  /** Planned duration in seconds for the active session. */
  plannedSeconds: number;
  /** Elapsed seconds since session start. */
  elapsedSeconds: number;
  /** Seconds elapsed past zero (for extra-focus phase). */
  extraSeconds: number;
  /** When the session started (Unix ms). */
  startedAtMs: number;
  /** Screen that triggered the session start. */
  origin: SessionOrigin;

  /** Whether extra-focus mode is globally enabled (shared with settingsStore). */
  extraFocusEnabled: boolean;

  setSelectedTag: (tagId: string | null) => void;
  setSelectedTask: (taskId: string | null) => void;
  setExtraFocusEnabled: (enabled: boolean) => void;

  /**
   * Start a session.
   * Resolves free-focus task if no taskId provided.
   * Throws if no tagId selected.
   * `origin` tracks which screen initiated the session for post-session navigation.
   */
  startSession: (origin: SessionOrigin) => Promise<void>;

  /** Tick — called every second by the screen's interval. */
  tick: () => void;

  /**
   * Long-press abandon: called when the 5-second hold completes.
   * Records the session with abandoned=true and actual elapsed seconds.
   */
  abandonSession: () => Promise<void>;

  /**
   * Called when countdown reaches zero and extra-focus mode is OFF.
   * Saves completed session, transitions to 'completed' phase.
   */
  completeSession: () => Promise<void>;

  /**
   * Called when user taps during extra-focus counting (phase === 'extra').
   * Records extra_minutes = floor(extraSeconds / 60), transitions to 'completed'.
   */
  stopExtraFocus: () => Promise<void>;

  /** Reset back to idle (after dismissing the completion screen). */
  resetToIdle: () => void;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  phase: 'idle',
  selectedTagId: null,
  selectedTaskId: null,
  lastUsedTagId: null,
  activeSessionId: null,
  plannedSeconds: 0,
  elapsedSeconds: 0,
  extraSeconds: 0,
  startedAtMs: 0,
  origin: 'Timer',
  extraFocusEnabled: false,

  setSelectedTag: (tagId) => set({ selectedTagId: tagId }),
  setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
  setExtraFocusEnabled: (enabled) => set({ extraFocusEnabled: enabled }),

  startSession: async (origin) => {
    const { selectedTagId, selectedTaskId } = get();
    if (!selectedTagId) {
      throw new Error('Select a tag before starting a session.');
    }

    // Resolve task: if no task selected, use the tag's free-focus slot.
    let taskId = selectedTaskId;
    if (!taskId) {
      const freeTask = await useTaskStore.getState().getFreeFocusTask(selectedTagId);
      if (!freeTask) {
        throw new Error('Free-focus task not found for this tag.');
      }
      taskId = freeTask.id;
    }

    // Resolve planned duration via the priority chain.
    const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    const duration = await useTagStore
      .getState()
      .resolveDuration(selectedTagId, task?.custom_duration ?? null);

    const db = await getDb();
    const sessionId = generateUUID();
    const now = nowISO();
    const startMs = Date.now();

    await db.runAsync(
      `INSERT INTO sessions
         (id, tag_id, task_id, duration, actual_seconds, extra_minutes,
          abandoned, started_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?)`,
      sessionId, selectedTagId, taskId, duration, now, now,
    );

    set({
      phase: 'countdown',
      activeSessionId: sessionId,
      plannedSeconds: duration * 60,
      elapsedSeconds: 0,
      extraSeconds: 0,
      startedAtMs: startMs,
      origin,
      lastUsedTagId: selectedTagId,
    });
  },

  tick: () => {
    const { phase, elapsedSeconds, plannedSeconds, extraSeconds, extraFocusEnabled } = get();

    if (phase === 'countdown') {
      const next = elapsedSeconds + 1;
      if (next >= plannedSeconds) {
        if (extraFocusEnabled) {
          // Switch to extra-focus: no sound/haptic, start counting up.
          set({ phase: 'extra', elapsedSeconds: plannedSeconds, extraSeconds: 0 });
        } else {
          // Normal completion: screen calls completeSession().
          set({ elapsedSeconds: plannedSeconds });
          get().completeSession();
        }
      } else {
        set({ elapsedSeconds: next });
      }
    } else if (phase === 'extra') {
      set({ extraSeconds: extraSeconds + 1 });
    }
  },

  abandonSession: async () => {
    const { activeSessionId, elapsedSeconds } = get();
    if (!activeSessionId) return;

    const db = await getDb();
    await db.runAsync(
      `UPDATE sessions
       SET abandoned = 1, actual_seconds = ?, updated_at = ?
       WHERE id = ?`,
      elapsedSeconds, nowISO(), activeSessionId,
    );

    // Stop ambient audio when session ends (spec: audio stops on abandon).
    await useAudioStore.getState().stopAll();

    set({
      phase: 'idle',
      activeSessionId: null,
      elapsedSeconds: 0,
      extraSeconds: 0,
    });
  },

  completeSession: async () => {
    const { activeSessionId, elapsedSeconds } = get();
    if (!activeSessionId) return;

    const db = await getDb();
    await db.runAsync(
      `UPDATE sessions
       SET abandoned = 0, actual_seconds = ?, extra_minutes = 0, updated_at = ?
       WHERE id = ?`,
      elapsedSeconds, nowISO(), activeSessionId,
    );

    // Fire audio and/or haptic per notification_type setting.
    const { notification_type } = useSettingsStore.getState();
    if (notification_type === 'sound' || notification_type === 'both') {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/audio/complete.mp3'),
          { shouldPlay: true },
        );
        // Unload after playback finishes.
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
        });
      } catch {
        // Asset may not exist in dev — ignore.
      }
    }
    if (notification_type === 'vibration' || notification_type === 'both') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    // Stop ambient audio when session ends (spec: audio stops on completion).
    await useAudioStore.getState().stopAll();

    set({ phase: 'completed' });
  },

  stopExtraFocus: async () => {
    const { activeSessionId, elapsedSeconds, extraSeconds } = get();
    if (!activeSessionId) return;

    const extraMinutes = Math.floor(extraSeconds / 60);
    const db = await getDb();
    await db.runAsync(
      `UPDATE sessions
       SET abandoned = 0, actual_seconds = ?, extra_minutes = ?, updated_at = ?
       WHERE id = ?`,
      elapsedSeconds + extraSeconds, extraMinutes, nowISO(), activeSessionId,
    );

    // Stop ambient audio when extra focus session ends.
    await useAudioStore.getState().stopAll();

    set({ phase: 'completed', extraSeconds });
  },

  resetToIdle: () =>
    set({
      phase: 'idle',
      activeSessionId: null,
      elapsedSeconds: 0,
      extraSeconds: 0,
    }),
}));
