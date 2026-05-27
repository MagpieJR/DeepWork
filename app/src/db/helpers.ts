import { SQLiteDatabase } from 'expo-sqlite';

// ─── UUID / Timestamp ────────────────────────────────────────────────────────

/** RFC 4122 UUID v4 — works without crypto.randomUUID (RN safe). */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Current moment as ISO 8601 string. */
export function nowISO(): string {
  return new Date().toISOString();
}

// ─── Soft Delete ─────────────────────────────────────────────────────────────

/**
 * Soft-delete a record: sets deleted_at and updated_at to the current timestamp.
 * Never issues a hard DELETE — satisfies the Soft Delete + sync propagation
 * requirement from the auth-sync spec.
 *
 * After this call, `queryAll` / `queryFirst` will automatically exclude the row.
 */
export async function deleteRecord(
  db: SQLiteDatabase,
  table: 'tags' | 'tasks' | 'sessions' | 'settings',
  id: string,
): Promise<void> {
  const now = nowISO();
  await db.runAsync(
    `UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ?`,
    now, now, id,
  );
}

// ─── Query Helpers (soft-delete filter) ──────────────────────────────────────

/**
 * Select all non-deleted rows from a table.
 *
 * `sql` MUST include `WHERE deleted_at IS NULL` (enforced here by wrapping).
 * Use the overloads below instead of calling db.getAllAsync directly so that
 * every query is guaranteed to exclude soft-deleted rows.
 *
 * @param sql    Full SELECT statement — must contain `WHERE deleted_at IS NULL`
 * @param params Bind parameters
 */
export async function queryAll<T>(
  db: SQLiteDatabase,
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  if (!sql.toLowerCase().includes('deleted_at is null')) {
    throw new Error(
      `queryAll: query must filter deleted_at IS NULL.\nQuery: ${sql}`,
    );
  }
  return db.getAllAsync<T>(sql, params);
}

/**
 * Select the first non-deleted row matching the query.
 * Same contract as queryAll: sql must include `WHERE deleted_at IS NULL`.
 */
export async function queryFirst<T>(
  db: SQLiteDatabase,
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T | null> {
  if (!sql.toLowerCase().includes('deleted_at is null')) {
    throw new Error(
      `queryFirst: query must filter deleted_at IS NULL.\nQuery: ${sql}`,
    );
  }
  return (await db.getFirstAsync<T>(sql, params)) ?? null;
}
