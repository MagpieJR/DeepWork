import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './schema';

const DB_NAME = 'deepwork.db';

/**
 * Module-level promise that resolves to the initialized SQLite database.
 * Guaranteed to run migrations before resolving.
 * All stores call `getDb()` to obtain this reference.
 */
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Open the database and run all pending migrations.
 * Must be called once at app startup (before rendering any screen that uses data).
 * Safe to call multiple times — returns the same promise on subsequent calls.
 */
export function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await migrateDatabase(db);
    return db;
  })();

  return _dbPromise;
}

/**
 * Returns the initialized database.
 * Throws if `initDatabase()` has not been called yet.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbPromise) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return _dbPromise;
}
