import { create } from 'zustand';
import { getDb } from '../db/database';
import { deleteRecord, generateUUID, nowISO, queryAll, queryFirst } from '../db/helpers';
import { Task } from './tagStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaskType = 'daily' | 'scheduled' | 'weekly';

export interface CreateTaskInput {
  tag_id: string;
  title: string;
  task_type: TaskType;
  custom_duration?: number;
  /** Required when task_type === 'scheduled'. ISO 8601. */
  scheduled_at?: string;
  /** 0–6 (Sunday = 0) for weekly reminder day. */
  reminder_day?: number;
  /** 'HH:MM' for reminder time. */
  reminder_time?: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface TaskState {
  /** All non-deleted, non-free-focus tasks. */
  tasks: Task[];

  loadTasks: () => Promise<void>;

  /**
   * Create a task. Requires tag_id (enforced: throws if missing).
   * Defaults is_completed = 0, is_free_focus = 0, missed_count = 0.
   */
  createTask: (input: CreateTaskInput) => Promise<Task>;

  /** Update mutable fields of a task. */
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'task_type' | 'custom_duration' | 'scheduled_at' | 'reminder_day' | 'reminder_time' | 'tag_id'>>,
  ) => Promise<void>;

  /** Soft-delete a task. */
  deleteTask: (id: string) => Promise<void>;

  /**
   * Toggle completion state.
   * true  → is_completed = 1
   * false → is_completed = 0
   */
  toggleComplete: (id: string, completed: boolean) => Promise<void>;

  /**
   * Reset daily tasks at 12:00 local time.
   * Marks incomplete tasks as missed (increments missed_count) then clears is_completed.
   */
  resetDailyTasks: () => Promise<void>;

  /**
   * Reset weekly tasks at Sunday midnight.
   * Returns tasks that were incomplete so the UI can prompt rescheduling.
   */
  resetWeeklyTasks: () => Promise<Task[]>;

  /**
   * Return all scheduled tasks that are past-due and still incomplete.
   * Used by the UI to show the "move or mark incomplete" prompt.
   */
  getPastDueScheduled: () => Promise<Task[]>;

  /** Return all live tasks for a given type, excluding free-focus entries. */
  getByType: (type: TaskType) => Task[];

  /** Return the free-focus task for a given tag. */
  getFreeFocusTask: (tagId: string) => Promise<Task | null>;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    const db = await getDb();
    const tasks = await queryAll<Task>(
      db,
      'SELECT * FROM tasks WHERE deleted_at IS NULL AND is_free_focus = 0 ORDER BY updated_at DESC',
    );
    set({ tasks });
  },

  createTask: async (input) => {
    // 4.1 — tag_id is required; UI should block this but store enforces it too.
    if (!input.tag_id) {
      throw new Error('A tag must be selected before creating a task.');
    }

    const db = await getDb();
    const now = nowISO();
    const id = generateUUID();

    await db.runAsync(
      `INSERT INTO tasks
         (id, tag_id, title, task_type, custom_duration, is_free_focus,
          is_completed, missed_count, scheduled_at, reminder_day, reminder_time, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)`,
      id,
      input.tag_id,
      input.title,
      input.task_type,
      input.custom_duration ?? null,
      input.scheduled_at ?? null,
      input.reminder_day ?? null,
      input.reminder_time ?? null,
      now,
    );

    await get().loadTasks();
    return get().tasks.find((t) => t.id === id)!;
  },

  updateTask: async (id, updates) => {
    const db = await getDb();
    const fields: string[] = [];
    const params: (string | number | null)[] = [];

    const setField = (col: string, val: string | number | null | undefined) => {
      if (val !== undefined) { fields.push(`${col} = ?`); params.push(val ?? null); }
    };

    setField('tag_id', updates.tag_id);
    setField('title', updates.title);
    setField('task_type', updates.task_type);
    setField('custom_duration', updates.custom_duration ?? null);
    setField('scheduled_at', updates.scheduled_at ?? null);
    setField('reminder_day', updates.reminder_day ?? null);
    setField('reminder_time', updates.reminder_time ?? null);

    if (fields.length === 0) return;
    fields.push('updated_at = ?');
    params.push(nowISO(), id);

    await db.runAsync(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, ...params);
    await get().loadTasks();
  },

  deleteTask: async (id) => {
    const db = await getDb();
    await deleteRecord(db, 'tasks', id);
    await get().loadTasks();
  },

  toggleComplete: async (id, completed) => {
    const db = await getDb();
    await db.runAsync(
      'UPDATE tasks SET is_completed = ?, updated_at = ? WHERE id = ?',
      completed ? 1 : 0, nowISO(), id,
    );
    await get().loadTasks();
  },

  resetDailyTasks: async () => {
    const db = await getDb();
    const now = nowISO();

    // Mark incomplete daily tasks as missed before resetting.
    await db.runAsync(
      `UPDATE tasks
       SET missed_count = missed_count + 1, updated_at = ?
       WHERE deleted_at IS NULL AND is_free_focus = 0
         AND task_type = 'daily' AND is_completed = 0`,
      now,
    );

    // Reset completion state for all daily tasks.
    await db.runAsync(
      `UPDATE tasks SET is_completed = 0, updated_at = ?
       WHERE deleted_at IS NULL AND is_free_focus = 0 AND task_type = 'daily'`,
      now,
    );

    await get().loadTasks();
  },

  resetWeeklyTasks: async () => {
    const db = await getDb();
    const now = nowISO();

    // Collect incomplete weekly tasks before reset (UI will prompt rescheduling).
    const incomplete = await queryAll<Task>(
      db,
      `SELECT * FROM tasks
       WHERE deleted_at IS NULL AND is_free_focus = 0
         AND task_type = 'weekly' AND is_completed = 0`,
    );

    // Reset all weekly tasks.
    await db.runAsync(
      `UPDATE tasks SET is_completed = 0, updated_at = ?
       WHERE deleted_at IS NULL AND is_free_focus = 0 AND task_type = 'weekly'`,
      now,
    );

    await get().loadTasks();
    return incomplete;
  },

  getPastDueScheduled: async () => {
    const db = await getDb();
    const now = nowISO();
    return queryAll<Task>(
      db,
      `SELECT * FROM tasks
       WHERE deleted_at IS NULL AND is_free_focus = 0
         AND task_type = 'scheduled'
         AND is_completed = 0
         AND scheduled_at IS NOT NULL
         AND scheduled_at < ?`,
      [now],
    );
  },

  getByType: (type) => get().tasks.filter((t) => t.task_type === type),

  getFreeFocusTask: async (tagId) => {
    const db = await getDb();
    return queryFirst<Task>(
      db,
      'SELECT * FROM tasks WHERE deleted_at IS NULL AND tag_id = ? AND is_free_focus = 1',
      [tagId],
    );
  },
}));
