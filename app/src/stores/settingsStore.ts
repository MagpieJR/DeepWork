import { create } from 'zustand';
import { getDb } from '../db/database';
import { nowISO } from '../db/helpers';

export type NotificationType = 'vibration' | 'sound' | 'both';

export interface Settings {
  global_duration: number;
  notification_type: NotificationType;
  extra_focus_mode: number; // 0 | 1
  do_not_disturb_start: string | null;
  do_not_disturb_end: string | null;
}

interface SettingsState extends Settings {
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  loaded: false,
  global_duration: 25,
  notification_type: 'both',
  extra_focus_mode: 0,
  do_not_disturb_start: null,
  do_not_disturb_end: null,

  loadSettings: async () => {
    const db = await getDb();
    const row = await db.getFirstAsync<Settings>(
      "SELECT global_duration, notification_type, extra_focus_mode, do_not_disturb_start, do_not_disturb_end FROM settings WHERE id = 'default'",
    );
    if (row) set({ ...row, loaded: true });
  },

  updateSetting: async (key, value) => {
    const db = await getDb();
    await db.runAsync(
      `UPDATE settings SET ${key} = ?, updated_at = ? WHERE id = 'default'`,
      value as string | number | null, nowISO(),
    );
    set({ [key]: value } as any);
  },
}));
