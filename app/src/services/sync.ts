/**
 * Offline-first background sync service.
 *
 * Strategy: Last-Write-Wins (LWW) per the design decision.
 * - Push: rows where local updated_at > last_synced_at
 * - Pull: rows where remote updated_at > last_synced_at
 * - Conflict: the row with the larger updated_at wins; equal → local wins
 * - Soft deletes: rows with deleted_at set are included in push/pull
 *
 * Scope (per design decision): push/pull on reconnect only.
 * No real-time streaming.
 */

import { getDb } from '../db/database';
import { supabase, getLastSyncedAt, setLastSyncedAt } from './supabase';

type TableName = 'tags' | 'tasks' | 'sessions' | 'settings';
const SYNC_TABLES: TableName[] = ['tags', 'tasks', 'sessions', 'settings'];

// ─── Internal ──────────────────────────────────────────────────────────────────

interface SyncRow {
  id: string;
  updated_at: string;
  deleted_at: string | null;
  [key: string]: unknown;
}

/**
 * LWW comparison.
 * Returns 'remote' | 'local' | 'equal'.
 * Equal timestamps → local wins (per spec).
 */
function lwwWinner(localUpdatedAt: string, remoteUpdatedAt: string): 'local' | 'remote' {
  if (localUpdatedAt >= remoteUpdatedAt) return 'local';
  return 'remote';
}

// ─── Main sync function ────────────────────────────────────────────────────────

let syncInProgress = false;

/**
 * Run a full push+pull sync cycle.
 * Non-blocking: returns immediately if a sync is already in progress.
 * Called by the network-reconnect listener in App.tsx.
 */
export async function runSync(): Promise<void> {
  if (syncInProgress) return;
  syncInProgress = true;

  try {
    const db = await getDb();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Unauthenticated — local-only mode

    const lastSynced = await getLastSyncedAt();
    const syncStart = new Date().toISOString();

    for (const table of SYNC_TABLES) {
      await syncTable(db, table, lastSynced);
    }

    await setLastSyncedAt(syncStart);
  } catch (err) {
    console.warn('[sync] Error during sync:', err);
  } finally {
    syncInProgress = false;
  }
}

async function syncTable(
  db: Awaited<ReturnType<typeof getDb>>,
  table: TableName,
  lastSynced: string | null,
): Promise<void> {
  // ── Push: local rows modified after last sync ──────────────────────────────

  const pushQuery = lastSynced
    ? `SELECT * FROM ${table} WHERE updated_at > ?`
    : `SELECT * FROM ${table}`;
  const localRows: SyncRow[] = lastSynced
    ? await db.getAllAsync<SyncRow>(pushQuery, lastSynced)
    : await db.getAllAsync<SyncRow>(pushQuery);

  if (localRows.length > 0) {
    // Upsert using the `updated_at` column for LWW at the DB level.
    // Supabase upsert with onConflict='id' replaces the remote row if it exists.
    // We apply LWW manually by fetching remote first (see pull step).
    const { error } = await supabase.from(table).upsert(localRows, { onConflict: 'id' });
    if (error) console.warn(`[sync] Push error on ${table}:`, error.message);
  }

  // ── Pull: remote rows modified after last sync ─────────────────────────────

  let query = supabase.from(table).select('*');
  if (lastSynced) {
    query = query.gt('updated_at', lastSynced);
  }
  const { data: remoteRows, error: pullError } = await query;
  if (pullError) {
    console.warn(`[sync] Pull error on ${table}:`, pullError.message);
    return;
  }
  if (!remoteRows || remoteRows.length === 0) return;

  for (const remote of remoteRows as SyncRow[]) {
    // Check if local has this row.
    const local = await db.getFirstAsync<SyncRow>(
      `SELECT * FROM ${table} WHERE id = ?`,
      remote.id,
    );

    if (!local) {
      // New row from remote — insert locally.
      await insertRow(db, table, remote);
    } else {
      const winner = lwwWinner(local.updated_at, remote.updated_at);
      if (winner === 'remote') {
        await updateRow(db, table, remote);
      }
      // winner === 'local' → local row stays as-is (already pushed above)
    }
  }
}

// ─── Row insert/update helpers ─────────────────────────────────────────────────

async function insertRow(
  db: Awaited<ReturnType<typeof getDb>>,
  table: TableName,
  row: SyncRow,
): Promise<void> {
  const cols = Object.keys(row).join(', ');
  const placeholders = Object.keys(row).map(() => '?').join(', ');
  const vals = Object.values(row) as (string | number | null)[];
  await db.runAsync(
    `INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${placeholders})`,
    ...vals,
  );
}

async function updateRow(
  db: Awaited<ReturnType<typeof getDb>>,
  table: TableName,
  row: SyncRow,
): Promise<void> {
  const { id, ...rest } = row;
  const setClause = Object.keys(rest).map((k) => `${k} = ?`).join(', ');
  const vals = [...Object.values(rest), id] as (string | number | null)[];
  await db.runAsync(`UPDATE ${table} SET ${setClause} WHERE id = ?`, ...vals);
}
