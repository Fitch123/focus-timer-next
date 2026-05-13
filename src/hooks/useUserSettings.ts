import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTimerSettings } from "@/context/TimerSettingsContext";
import type { User } from "@supabase/supabase-js";

export default function useUserSettings(user: User | null) {
  const { settings, updateSettings } = useTimerSettings();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (loadedRef.current) return;

    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_settings") // ✅
        .select("*")
        .eq("user_id", user.id) // ✅
        .maybeSingle();

      if (error) {
        console.error("❌ load error:", error);
        return;
      }

      if (data) {
        loadedRef.current = true;
        updateSettings({
          focus: data.focus ?? 25,
          breakTime: data.break_time ?? 5,
          longBreak: data.long_break ?? 15,
          longBreakInterval: data.long_break_interval ?? 4,
          autoStartBreak: data.auto_start_break ?? true,
          autoStartFocus: data.auto_start_focus ?? true,
          strictMode: data.strict_mode ?? false,
          alarmSound: data.alarm_sound ?? "bell",
          alarmVolume: data.alarm_volume ?? 0.9,
          notificationsEnabled: data.notifications_enabled ?? true,
          confettiEnabled: data.confetti_enabled ?? true,
          darkMode: data.dark_mode ?? false,
        });
      }
    };

    load();
  }, [user]);

  const saveSettings = async (latestSettings = settings) => {
    if (!user) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("user_settings") // ✅
      .upsert(
        {
          // ✅ upsert in case row doesn't exist
          user_id: user.id,
          focus: latestSettings.focus,
          break_time: latestSettings.breakTime,
          long_break: latestSettings.longBreak,
          long_break_interval: latestSettings.longBreakInterval,
          auto_start_break: latestSettings.autoStartBreak,
          auto_start_focus: latestSettings.autoStartFocus,
          strict_mode: latestSettings.strictMode,
          alarm_sound: latestSettings.alarmSound,
          alarm_volume: latestSettings.alarmVolume,
          notifications_enabled: latestSettings.notificationsEnabled,
          confetti_enabled: latestSettings.confettiEnabled,
          dark_mode: latestSettings.darkMode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      ); // ✅ specify conflict target);

    if (error) {
      console.error("❌ save error:", JSON.stringify(error));
    } else {
      console.log("✅ saved to Supabase");
    }
  };

  return { saveSettings };
}
