import { create } from 'zustand';
import { getDb } from '../db/database';
import { deleteRecord, generateUUID, nowISO, queryAll, queryFirst } from '../db/helpers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string;
  /** Optional default pomodoro duration in minutes. */
  default_duration: number | null;
  updated_at: string;
  deleted_at: string | null;
}

export interface Task {
  id: string;
  tag_id: string;
  title: string;
  task_type: 'daily' | 'scheduled' | 'weekly';
  custom_duration: number | null;
  is_free_focus: number; // 0 | 1 (SQLite boolean)
  is_completed: number;
  missed_count: number;
  scheduled_at: string | null;
  reminder_day: number | null;
  reminder_time: string | null;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface TagState {
  tags: Tag[];

  /** Load all non-deleted tags from SQLite into the store. */
  loadTags: () => Promise<void>;

  /**
   * Create a new tag with a name, color, and optional default duration.
   * Automatically creates the free-focus task for the tag.
   * Throws if a non-deleted tag with the same name already exists.
   */
  createTag: (name: string, color: string, defaultDuration?: number) => Promise<Tag>;

  /**
   * Update an existing tag's name, color, and/or default duration.
   * Throws if the new name conflicts with another existing tag.
   */
  updateTag: (id: string, updates: { name?: string; color?: string; default_duration?: number | null }) => Promise<void>;

  /**
   * Soft-delete a tag. Throws if the tag has associated tasks or sessions
   * (per spec: tag with tasks/sessions cannot be deleted).
   */
  deleteTag: (id: string) => Promise<void>;

  /**
   * Resolve session duration using the priority chain:
   *   task.custom_duration ?? tag.default_duration ?? settings.global_duration
   */
  resolveDuration: (tagId: string, taskCustomDuration: number | null) => Promise<number>;
}

export const useTagStore = create<TagState>()((set, get) => ({
  tags: [],

  loadTags: async () => {
    const db = await getDb();
    const tags = await queryAll<Tag>(
      db,
      'SELECT * FROM tags WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    set({ tags });
  },

  createTag: async (name, color, defaultDuration) => {
    const db = await getDb();

    // Uniqueness check — case-insensitive among non-deleted tags.
    const existing = await queryFirst<Tag>(
      db,
      'SELECT id FROM tags WHERE deleted_at IS NULL AND lower(name) = lower(?)',
      [name],
    );
    if (existing) {
      throw new Error(`A tag named "${name}" already exists.`);
    }

    const now = nowISO();
    const tagId = generateUUID();

    await db.runAsync(
      `INSERT INTO tags (id, name, color, default_duration, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      tagId, name, color, defaultDuration ?? null, now,
    );

    // Create the free-focus task automatically (never visible in task lists).
    const freeFocusId = generateUUID();
    await db.runAsync(
      `INSERT INTO tasks
         (id, tag_id, title, task_type, is_free_focus, is_completed, missed_count, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, 0, ?)`,
      freeFocusId, tagId, 'Free Focus', 'daily', now,
    );

    await get().loadTags();
    const tag = get().tags.find((t) => t.id === tagId)!;
    return tag;
  },

  updateTag: async (id, updates) => {
    const db = await getDb();

    if (updates.name !== undefined) {
      const conflict = await queryFirst<Tag>(
        db,
        'SELECT id FROM tags WHERE deleted_at IS NULL AND lower(name) = lower(?) AND id != ?',
        [updates.name, id],
      );
      if (conflict) {
        throw new Error(`A tag named "${updates.name}" already exists.`);
      }
    }

    const fields: string[] = [];
    const params: (string | number | null)[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.color !== undefined) { fields.push('color = ?'); params.push(updates.color); }
    if ('default_duration' in updates) { fields.push('default_duration = ?'); params.push(updates.default_duration ?? null); }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    params.push(nowISO());
    params.push(id);

    await db.runAsync(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, ...params);
    await get().loadTags();
  },

  deleteTag: async (id) => {
    const db = await getDb();

    // Block deletion if the tag has live (non-deleted) tasks or sessions.
    const linkedTask = await queryFirst<{ id: string }>(
      db,
      'SELECT id FROM tasks WHERE deleted_at IS NULL AND tag_id = ? AND is_free_focus = 0 LIMIT 1',
      [id],
    );
    if (linkedTask) {
      throw new Error('Cannot delete a tag that has tasks. Remove all tasks first.');
    }

    const linkedSession = await queryFirst<{ id: string }>(
      db,
      'SELECT id FROM sessions WHERE deleted_at IS NULL AND tag_id = ? LIMIT 1',
      [id],
    );
    if (linkedSession) {
      throw new Error('Cannot delete a tag that has session records.');
    }

    await deleteRecord(db, 'tags', id);
    await get().loadTags();
  },

  resolveDuration: async (tagId, taskCustomDuration) => {
    // Highest priority: task's own custom duration.
    if (taskCustomDuration != null) return taskCustomDuration;

    const db = await getDb();

    // Middle priority: tag's default duration.
    const tag = await queryFirst<Tag>(
      db,
      'SELECT default_duration FROM tags WHERE deleted_at IS NULL AND id = ?',
      [tagId],
    );
    if (tag?.default_duration != null) return tag.default_duration;

    // Lowest priority: global setting.
    const settings = await db.getFirstAsync<{ global_duration: number }>(
      "SELECT global_duration FROM settings WHERE id = 'default'",
    );
    return settings?.global_duration ?? 25;
  },
}));
