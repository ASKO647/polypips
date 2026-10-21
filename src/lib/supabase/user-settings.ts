import type { SupabaseClient } from "@supabase/supabase-js";

export type ThemeChoice = "light" | "dark" | "system";
export type StartPage = "dashboard" | "polymarket";

export type UserSettings = {
  themeChoice: ThemeChoice;
  density: "comfortable" | "compact";
  animations: boolean;
  reduceMotion: boolean;
  contrast: boolean;
  textSize: number;
  keyboardFocus: boolean;
  timezone: string;
  dateFormat: "long" | "short";
  startPage: StartPage;
  resumeLastSession: boolean;
  notificationsAppEnabled: boolean;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  themeChoice: "light",
  density: "comfortable",
  animations: true,
  reduceMotion: false,
  contrast: false,
  textSize: 50,
  keyboardFocus: true,
  timezone: "Europe/Paris",
  dateFormat: "long",
  startPage: "dashboard",
  resumeLastSession: true,
  notificationsAppEnabled: true,
};

/** Reads this user's synced preferences, falling back to defaults for any
 * field missing from `data` (new fields added after a user's row was first
 * created, or no row at all yet). Never throws — a read failure behaves
 * like "no settings saved yet". */
export async function fetchUserSettings(supabase: SupabaseClient): Promise<UserSettings> {
  const { data, error } = await supabase.from("user_settings").select("data").maybeSingle();
  if (error || !data) return DEFAULT_USER_SETTINGS;
  return { ...DEFAULT_USER_SETTINGS, ...(data.data as Partial<UserSettings>) };
}

/** Merges `patch` into the signed-in user's stored settings (own-row RLS
 * enforces this can only ever target `auth.uid()`). */
export async function saveUserSettings(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<UserSettings>
): Promise<UserSettings> {
  const current = await fetchUserSettings(supabase);
  const next = { ...current, ...patch };
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, data: next }, { onConflict: "user_id" });
  if (error) throw error;
  return next;
}
