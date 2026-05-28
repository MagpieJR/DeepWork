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

async function migration2(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  const defaultTags: { id: string; taskId: string; name: string; color: string }[] = [
    { id: '00000000-0000-0000-0000-000000000001', taskId: '00000000-0000-0000-0000-000000000011', name: '工作', color: '#3a7fb5' },
    { id: '00000000-0000-0000-0000-000000000002', taskId: '00000000-0000-0000-0000-000000000012', name: '閱讀', color: '#3aaa6e' },
    { id: '00000000-0000-0000-0000-000000000003', taskId: '00000000-0000-0000-0000-000000000013', name: '運動', color: '#cc5555' },
  ];

  for (const tag of defaultTags) {
    await db.runAsync(
      `INSERT OR IGNORE INTO tags (id, name, color, default_duration, updated_at)
       VALUES (?, ?, ?, NULL, ?)`,
      tag.id, tag.name, tag.color, now,
    );
    await db.runAsync(
      `INSERT OR IGNORE INTO tasks
         (id, tag_id, title, task_type, is_free_focus, is_completed, missed_count, updated_at)
       VALUES (?, ?, 'Free Focus', 'daily', 1, 0, 0, ?)`,
      tag.taskId, tag.id, now,
    );
  }

  await db.execAsync('PRAGMA user_version = 2');
}

async function migration4(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR IGNORE INTO tags (id, name, color, default_duration, updated_at)
     VALUES (?, ?, ?, NULL, ?)`,
    '00000000-0000-0000-0000-000000000005', '健身', '#c48a3f', now,
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO tasks
       (id, tag_id, title, task_type, is_free_focus, is_completed, missed_count, updated_at)
     VALUES (?, ?, 'Free Focus', 'daily', 1, 0, 0, ?)`,
    '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000005', now,
  );

  await db.execAsync('PRAGMA user_version = 4');
}

async function migration3(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR IGNORE INTO tags (id, name, color, default_duration, updated_at)
     VALUES (?, ?, ?, NULL, ?)`,
    '00000000-0000-0000-0000-000000000004', '學習', '#7b6cc4', now,
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO tasks
       (id, tag_id, title, task_type, is_free_focus, is_completed, missed_count, updated_at)
     VALUES (?, ?, 'Free Focus', 'daily', 1, 0, 0, ?)`,
    '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000004', now,
  );

  await db.execAsync('PRAGMA user_version = 3');
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

  if (version < 2) {
    await migration2(db);
  }

  if (version < 3) {
    await migration3(db);
  }

  if (version < 4) {
    await migration4(db);
  }
}
