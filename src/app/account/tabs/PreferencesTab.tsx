"use client";

import { useState } from "react";
import Toggle from "@/components/Toggle";
import { useTimerSettings } from "@/context/TimerSettingsContext";

export default function PreferencesTab() {
  const { settings, updateSettings, saveSettings } = useTimerSettings();
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Preferences</h2>

      {/* Timer */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Timer
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Long Break</span>
          <input
            type="number"
            min={1}
            max={60}
            step={1}
            value={settings.longBreak}
            onChange={(e) =>
              updateSettings({ longBreak: Math.round(Number(e.target.value)) })
            }
            className="w-16 border rounded-md p-1 text-center text-sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Long Break Interval</span>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={settings.longBreakInterval}
            onChange={(e) =>
              updateSettings({
                longBreakInterval: Math.round(Number(e.target.value)),
              })
            }
            className="w-16 border rounded-md p-1 text-center text-sm"
          />
        </div>
      </div>

      {/* Today's Goal */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Today's Goal
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Daily sessions goal</span>
          <input
            type="number"
            min={1}
            max={20}
            step={1}
            value={settings.dailyGoal}
            onChange={(e) =>
              updateSettings({ dailyGoal: Math.round(Number(e.target.value)) })
            }
            className="w-16 border rounded-md p-1 text-center text-sm"
          />
        </div>
      </div>

      {/* Automation */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Automation
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Auto start break</span>
          <Toggle
            enabled={settings.autoStartBreak}
            setEnabled={(val) => updateSettings({ autoStartBreak: val })}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Auto start focus</span>
          <Toggle
            enabled={settings.autoStartFocus}
            setEnabled={(val) => updateSettings({ autoStartFocus: val })}
          />
        </div>
      </div>

      {/* Focus Mode */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Focus Mode
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Strict Mode</span>
          <Toggle
            enabled={settings.strictMode}
            setEnabled={(val) => updateSettings({ strictMode: val })}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Notifications
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Send alarm when timer ends
          </span>
          <Toggle
            enabled={settings.notificationsEnabled}
            setEnabled={(val) => updateSettings({ notificationsEnabled: val })}
          />
        </div>
      </div>

      {/* Extras */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Extras
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Confetti on session complete
          </span>
          <Toggle
            enabled={settings.confettiEnabled}
            setEnabled={(val) => updateSettings({ confettiEnabled: val })}
          />
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Theme
        </h3>
        <div className="flex gap-2">
          {(["clarity", "focus", "forest"] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateSettings({ theme: t })}
              className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all
          ${
            settings.theme === t
              ? "bg-black text-white"
              : "bg-black/5 text-gray-600 hover:bg-black/10"
          }`}
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

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm"
        >
          Save Preferences
        </button>
        {saved && <span className="text-sm text-green-500">Saved ✓</span>}
      </div>
    </div>
  );
}
