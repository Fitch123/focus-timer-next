"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

type TimerSettings = {
  focus: number;
  breakTime: number;
  longBreak: number;
  longBreakInterval: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  rankMode: boolean;
  alarmSound: string;
  alarmVolume: number;
  notificationsEnabled: boolean;
  confettiEnabled: boolean;
  darkMode: boolean;
  dailyGoal: number;
  theme: "focus" | "clarity" | "forest";
};

type TimerSettingsContextType = {
  settings: TimerSettings;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  saveSettings: (latestSettings?: Partial<TimerSettings>) => Promise<void>; // ✅ add
};

const defaultSettings: TimerSettings = {
  focus: 25,
  breakTime: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoStartBreak: true,
  autoStartFocus: true,
  rankMode: false,
  alarmSound: "bell",
  alarmVolume: 0.9,
  notificationsEnabled: false,
  confettiEnabled: true,
  darkMode: false,
  dailyGoal: 4,
  theme: "clarity",
};

const TimerSettingsContext = createContext<TimerSettingsContextType | null>(
  null,
);

export function TimerSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [userId, setUserId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const newUserId = session?.user?.id ?? null;
      setUserId(newUserId);
      if (!newUserId) loadedRef.current = false; // ✅ reset on logout
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Load from localStorage first (instant)
  useEffect(() => {
    const saved = localStorage.getItem("timer-settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    } else {
      localStorage.setItem("timer-settings", JSON.stringify(defaultSettings));
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // Load from Supabase when user logs in (overrides localStorage)
  useEffect(() => {
    if (!userId || loadedRef.current) return;

    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data) {
        loadedRef.current = true;
        const loaded: TimerSettings = {
          focus: data.focus ?? 25,
          breakTime: data.break_time ?? 5,
          longBreak: data.long_break ?? 15,
          longBreakInterval: data.long_break_interval ?? 4,
          autoStartBreak: data.auto_start_break ?? true,
          autoStartFocus: data.auto_start_focus ?? true,
          rankMode: data.rank_mode ?? false,
          alarmSound: data.alarm_sound ?? "bell",
          alarmVolume: data.alarm_volume ?? 0.9,
          notificationsEnabled: data.notifications_enabled ?? true,
          confettiEnabled: data.confetti_enabled ?? true,
          darkMode: data.dark_mode ?? false,
          dailyGoal: data.daily_goal ?? 4,
          theme: data.theme ?? "clarity",
        };
        setSettings(loaded);
        localStorage.setItem("timer-settings", JSON.stringify(loaded));
      }
    };

    load();
  }, [userId]);

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("timer-settings", JSON.stringify(updated));
  };

  const saveSettings = async (
    latestSettings: Partial<TimerSettings> = settings,
  ) => {
    if (!userId) return;

    const merged = { ...settings, ...latestSettings };
    const supabase = createClient();

    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        focus: Number(merged.focus),
        break_time: Number(merged.breakTime),
        long_break: Number(merged.longBreak),
        long_break_interval: Number(merged.longBreakInterval),
        daily_goal: Number(merged.dailyGoal),
        auto_start_break: Boolean(merged.autoStartBreak),
        auto_start_focus: Boolean(merged.autoStartFocus),
        rank_mode: Boolean(merged.rankMode),
        alarm_sound: String(merged.alarmSound),
        alarm_volume: Number(merged.alarmVolume), // ✅ force number
        notifications_enabled: Boolean(merged.notificationsEnabled),
        confetti_enabled: Boolean(merged.confettiEnabled),
        dark_mode: Boolean(merged.darkMode),
        theme: String(merged.theme),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("❌ save error:", JSON.stringify(error));
      console.error("❌ save error code:", error.code);
      console.error("❌ save error message:", error.message);

      console.log("🔍 upsert payload:", {
        focus: Number(merged.focus),
        break_time: Number(merged.breakTime),
        long_break: Number(merged.longBreak),
        long_break_interval: Number(merged.longBreakInterval),
        daily_goal: Number(merged.dailyGoal),
        rank_mode: Boolean(merged.rankMode),
        alarm_volume: Number(merged.alarmVolume),
      });
    }
  };

  return (
    <TimerSettingsContext.Provider
      value={{ settings, updateSettings, saveSettings }}
    >
      {children}
    </TimerSettingsContext.Provider>
  );
}

export function useTimerSettings() {
  const context = useContext(TimerSettingsContext);
  if (!context) {
    throw new Error(
      "useTimerSettings must be used inside TimerSettingsProvider",
    );
  }
  return context;
}
