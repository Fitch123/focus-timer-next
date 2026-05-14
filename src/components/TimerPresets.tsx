"use client";

import { useTimerSettings } from "@/context/TimerSettingsContext";
import { Settings } from "lucide-react";

type Preset = {
  label: string;
  focus: number;
  breakTime: number;
  longBreak: number;
};

const presets: Preset[] = [
  { label: "Pomodoro", focus: 25, breakTime: 5, longBreak: 15 },
  { label: "Short", focus: 15, breakTime: 3, longBreak: 10 },
  { label: "Long", focus: 50, breakTime: 10, longBreak: 20 },
];

interface TimerPresetsProps {
  isRunning: boolean;
  isPaused?: boolean;
  onPresetSelect?: () => void;
  onOpenSettings: () => void;
}

export default function TimerPresets({
  isRunning,
  isPaused,
  onPresetSelect,
  onOpenSettings,
}: TimerPresetsProps) {
  const { settings, updateSettings, saveSettings } = useTimerSettings();

  const activePreset = presets.find(
    (p) =>
      p.focus === settings.focus &&
      p.breakTime === settings.breakTime &&
      p.longBreak === settings.longBreak,
  );

  const handleSelect = async (preset: Preset) => {
    if (isRunning || isPaused) return;
    updateSettings({
      focus: preset.focus,
      breakTime: preset.breakTime,
      longBreak: preset.longBreak,
    });
    await saveSettings({
      ...settings,
      focus: preset.focus,
      breakTime: preset.breakTime,
      longBreak: preset.longBreak,
    });
    onPresetSelect?.();
  };

  const isCustom = !activePreset;

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {presets.map((preset) => {
        const isActive =
          settings.focus === preset.focus &&
          settings.breakTime === preset.breakTime &&
          settings.longBreak === preset.longBreak;

        return (
          <button
            key={preset.label}
            onClick={() => handleSelect(preset)}
            disabled={isRunning || isPaused}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-all
            ${isRunning || isPaused ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 active:scale-95"}`}
            style={
              isActive
                ? { background: "var(--text)", color: "var(--bg)" }
                : { background: "rgba(77, 74, 74, 0.06)", color: "var(--text)" }
            }
          >
            {preset.label}
          </button>
        );
      })}

      <button
        onClick={onOpenSettings}
        disabled={isRunning || isPaused}
        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
        ${isRunning || isPaused ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 active:scale-95"}`}
        style={
          isCustom
            ? { background: "var(--text)", color: "var(--bg)" }
            : { background: "rgba(0,0,0,0.06)", color: "var(--text)" }
        }
      >
        <Settings size={16} />
      </button>
    </div>
  );
}
