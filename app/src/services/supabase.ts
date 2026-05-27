import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Supabase client ──────────────────────────────────────────────────────────
//
// IMPORTANT: Replace these placeholder values with your real Supabase project
// URL and anon key before shipping. These are intentionally kept as constants
// so the app compiles and runs in dev against a real (or stubbed) project.
//
// Recommended: expose via expo-constants / .env using EXPO_PUBLIC_ prefix.

const SUPABASE_URL = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? 'your-anon-key';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

/** Key used to persist the last successful sync timestamp in AsyncStorage. */
export const LAST_SYNCED_AT_KEY = 'deepwork:last_synced_at';

export async function getLastSyncedAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNCED_AT_KEY);
}

export async function setLastSyncedAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNCED_AT_KEY, iso);
}
