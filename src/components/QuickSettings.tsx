"use client";

import { useTimerSettings } from "@/context/TimerSettingsContext";
import { useRef } from "react";

type QuickSettingsProps = {
  onClose: () => void;
};

export default function QuickSettings({ onClose }: QuickSettingsProps) {
  const { settings, updateSettings, saveSettings } = useTimerSettings();

  const handleSave = async () => {
    await saveSettings();
    onClose?.();
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
        Quick Settings
      </h2>

      {/* Timer */}
      <div className="space-y-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--text)" }}
        >
          Timer
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--text)" }}>
            Focus
          </span>
          <input
            type="number"
            min={1}
            max={90}
            step={1}
            value={settings.focus}
            onChange={(e) =>
              updateSettings({ focus: Math.round(Number(e.target.value)) })
            }
            className="w-16 rounded-md p-1 text-center text-sm border"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              borderColor: "rgba(0,0,0,0.1)",
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--text)" }}>
            Break
          </span>
          <input
            type="number"
            min={1}
            max={30}
            step={1}
            value={settings.breakTime}
            onChange={(e) =>
              updateSettings({ breakTime: Math.round(Number(e.target.value)) })
            }
            className="w-16 rounded-md p-1 text-center text-sm border"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              borderColor: "rgba(0,0,0,0.1)",
            }}
          />
        </div>
      </div>

      {/* Sound */}
      <div className="space-y-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--text)" }}
        >
          Sound
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--text)" }}>
            Alarm Sound
          </span>
          <select
            value={settings.alarmSound}
            onChange={(e) => {
              const sound = e.target.value;
              updateSettings({ alarmSound: sound });
              const soundMap: Record<string, string> = {
                bell: "/handBell.mp3",
                digital: "/digitalBell.mp3",
                school: "/schoolBell.mp3",
                clock: "/clockBell.mp3",
              };
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              const audio = new Audio(soundMap[sound] ?? "/focusBell.mp3");
              audio.volume = settings.alarmVolume ?? 0.9;
              audio.play().catch(() => {});
              audioRef.current = audio;
            }}
            className="rounded-md px-2 py-1 text-sm border"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              borderColor: "rgba(0,0,0,0.1)",
            }}
          >
            <option value="bell">Bell</option>
            <option value="digital">Digital</option>
            <option value="school">School</option>
            <option value="clock">Clock</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--text)" }}>
            Volume
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-xs w-8 text-right"
              style={{ color: "var(--text)" }}
            >
              {Math.round((settings.alarmVolume ?? 0.9) * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.alarmVolume ?? 0.9}
              onChange={(e) =>
                updateSettings({ alarmVolume: Number(e.target.value) })
              }
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--text)" }}
        >
          Theme
        </h3>
        <div className="flex gap-2">
          {(["clarity", "focus", "forest"] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateSettings({ theme: t })}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium capitalize transition-all"
              style={{
                background:
                  settings.theme === t ? "var(--text)" : "rgba(0,0,0,0.06)",
                color: settings.theme === t ? "var(--bg)" : "var(--text)",
              }}
            >
              {t === "clarity"
                ? "☀️ Clarity"
                : t === "focus"
                  ? "🌑 Focus"
                  : "🌿 Forest"}
            </button>
          ))}
        </div>
      </div>

      {/* Account Link */}
      <p className="text-xs text-center" style={{ color: "var(--text)" }}>
        For more settings, go to{" "}
        <a
          href="/account?tab=preferences"
          style={{ color: "var(--accent)" }}
          className="hover:underline"
        >
          Preferences
        </a>
        .
      </p>

      {/* Save */}
      <button
        onClick={handleSave}
        className="self-end px-4 py-2 rounded-md text-sm font-medium transition hover:opacity-90"
        style={{ background: "var(--text)", color: "var(--bg)" }}
      >
        Save
      </button>
    </div>
  );
}
