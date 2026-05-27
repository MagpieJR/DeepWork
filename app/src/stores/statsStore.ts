import { create } from 'zustand';
import { getDb } from '../db/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export type StatsView = 'today' | 'week';

interface RawSession {
  id: string;
  tag_id: string;
  task_id: string;
  extra_minutes: number;
  abandoned: number; // 0 | 1 in SQLite
  started_at: string;
}

export interface TagBreakdown {
  tag_id: string;
  tag_name: string;
  tag_color: string;
  completed_count: number;
}

export interface TaskBreakdown {
  task_id: string;
  task_title: string;
  tag_id: string;
  is_free_focus: number;
  completed_count: number;
}

interface StatsState {
  view: StatsView;
  completedCount: number;
  abandonedCount: number;
  extraFocusMinutes: number;
  tagBreakdown: TagBreakdown[];
  taskBreakdown: TaskBreakdown[];

  setView: (v: StatsView) => void;
  loadStats: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** ISO string for today at midnight local time. */
function todayMidnight(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** ISO string for the most recent Monday at midnight local time. */
function weekMondayMidnight(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // Days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString();
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStatsStore = create<StatsState>()((set, get) => ({
  view: 'today',
  completedCount: 0,
  abandonedCount: 0,
  extraFocusMinutes: 0,
  tagBreakdown: [],
  taskBreakdown: [],

  setView: (v) => { set({ view: v }); get().loadStats(); },

  loadStats: async () => {
    const db = await getDb();
    const { view } = get();

    const fromISO = view === 'today' ? todayMidnight() : weekMondayMidnight();
    const toISO = new Date().toISOString();

    // ── Summary block ──────────────────────────────────────────────────────

    const completedRow = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM sessions
       WHERE deleted_at IS NULL AND abandoned = 0
         AND started_at >= ? AND started_at <= ?`,
      fromISO, toISO,
    );
    const abandonedRow = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM sessions
       WHERE deleted_at IS NULL AND abandoned = 1
         AND started_at >= ? AND started_at <= ?`,
      fromISO, toISO,
    );
    // Extra focus minutes: only from completed (non-abandoned) sessions.
    const extraRow = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(extra_minutes), 0) AS total FROM sessions
       WHERE deleted_at IS NULL AND abandoned = 0
         AND started_at >= ? AND started_at <= ?`,
      fromISO, toISO,
    );

    // ── Tag breakdown ──────────────────────────────────────────────────────

    const tagBreakdown = await db.getAllAsync<TagBreakdown>(
      `SELECT
         s.tag_id,
         t.name  AS tag_name,
         t.color AS tag_color,
         COUNT(*) AS completed_count
       FROM sessions s
       JOIN tags t ON t.id = s.tag_id
       WHERE s.deleted_at IS NULL
         AND t.deleted_at IS NULL
         AND s.abandoned = 0
         AND s.started_at >= ? AND s.started_at <= ?
       GROUP BY s.tag_id
       ORDER BY completed_count DESC`,
      fromISO, toISO,
    );

    // ── Task breakdown ─────────────────────────────────────────────────────
    // Shows tasks with at least one completed session; free-focus appears as "Free Focus".

    const taskBreakdown = await db.getAllAsync<TaskBreakdown>(
      `SELECT
         s.task_id,
         CASE WHEN tk.is_free_focus = 1 THEN 'Free Focus' ELSE tk.title END AS task_title,
         tk.tag_id,
         tk.is_free_focus,
         COUNT(*) AS completed_count
       FROM sessions s
       JOIN tasks tk ON tk.id = s.task_id
       WHERE s.deleted_at IS NULL
         AND tk.deleted_at IS NULL
         AND s.abandoned = 0
         AND s.started_at >= ? AND s.started_at <= ?
       GROUP BY s.task_id
       HAVING COUNT(*) > 0
       ORDER BY completed_count DESC`,
      fromISO, toISO,
    );

    set({
      completedCount: completedRow?.cnt ?? 0,
      abandonedCount: abandonedRow?.cnt ?? 0,
      extraFocusMinutes: extraRow?.total ?? 0,
      tagBreakdown,
      taskBreakdown,
    });
  },
}));
