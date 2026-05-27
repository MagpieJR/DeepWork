import * as SQLite from 'expo-sqlite';

/**
 * Migration 1 — initial schema.
 *
 * Tables: tags, tasks, sessions, settings.
 * Every table includes: id (UUID TEXT PK), updated_at (TEXT ISO 8601),
 * deleted_at (TEXT ISO 8601 nullable) — required by the LWW + Soft Delete sync strategy.
 */
async function migration1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS tags (
      id            TEXT PRIMARY KEY NOT NULL,
      name          TEXT NOT NULL,
      color         TEXT NOT NULL,
      default_duration INTEGER,
      updated_at    TEXT NOT NULL,
      deleted_at    TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id            TEXT PRIMARY KEY NOT NULL,
      tag_id        TEXT NOT NULL,
      title         TEXT NOT NULL,
      task_type     TEXT NOT NULL,
      custom_duration INTEGER,
      is_free_focus INTEGER NOT NULL DEFAULT 0,
      is_completed  INTEGER NOT NULL DEFAULT 0,
      missed_count  INTEGER NOT NULL DEFAULT 0,
      scheduled_at  TEXT,
      reminder_day  INTEGER,
      reminder_time TEXT,
      updated_at    TEXT NOT NULL,
      deleted_at    TEXT,
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY NOT NULL,
      tag_id        TEXT NOT NULL,
      task_id       TEXT NOT NULL,
      duration      INTEGER NOT NULL,
      actual_seconds INTEGER NOT NULL DEFAULT 0,
      extra_minutes INTEGER NOT NULL DEFAULT 0,
      abandoned     INTEGER NOT NULL DEFAULT 0,
      started_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      deleted_at    TEXT,
      FOREIGN KEY (tag_id) REFERENCES tags(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id                    TEXT PRIMARY KEY NOT NULL,
      global_duration       INTEGER NOT NULL DEFAULT 25,
      notification_type     TEXT NOT NULL DEFAULT 'both',
      extra_focus_mode      INTEGER NOT NULL DEFAULT 0,
      do_not_disturb_start  TEXT,
      do_not_disturb_end    TEXT,
      updated_at            TEXT NOT NULL,
      deleted_at            TEXT
    );
  `);

  // Seed the single settings row used throughout the app.
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO settings
       (id, global_duration, notification_type, extra_focus_mode, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    'default', 25, 'both', 0, now,
  );

  // Bump schema version last — if anything above throws, version stays at 0
  // and the migration reruns on next launch.
  await db.execAsync('PRAGMA user_version = 1');
}

/**
 * Versioned migration runner.
 *
 * Pass this as the `onInit` callback to <SQLiteProvider> or call it after
 * openDatabaseAsync(). Uses PRAGMA user_version as the version counter.
 * Rule: only ADD columns / tables; never ALTER or DROP existing ones.
 */
export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await migration1(db);
  }

  // Future migrations follow the same pattern:
  // if (version < 2) { await migration2(db); }
}
