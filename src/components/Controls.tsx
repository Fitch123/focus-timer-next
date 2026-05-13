"use client";

interface ControlsProps {
  isRunning: boolean;
  strictMode: boolean;
  isTransitioning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

export default function Controls({
  isRunning,
  strictMode,
  isTransitioning,
  start,
  pause,
  reset,
  skip,
}: ControlsProps) {
  const isBlocked = strictMode && (isRunning || isTransitioning);

  const handleToggle = () => {
    if (isRunning) pause();
    else start();
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-[300px]">
      {/* Start / Pause */}
      <button
        disabled={isBlocked}
        onClick={handleToggle}
        className={`w-full py-3 rounded-xl font-semibold text-base transition-all
          ${isBlocked ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"}`}
        style={{
          background: "var(--accent)",
          color: "#fff",
          boxShadow:
            "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)",
          border: "1px solid var(--border)",
        }}
      >
        {isRunning ? "Pause" : "Start"}
      </button>

      {/* Reset + Skip */}
      <div className="flex gap-2">
        <button
          disabled={strictMode}
          onClick={reset}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
            ${strictMode ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"}`}
          style={{
            background: "var(--card)",
            color: "var(--text)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid var(--border)",
          }}
        >
          Reset
        </button>
        <button
          disabled={strictMode}
          onClick={skip}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
            ${strictMode ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"}`}
          style={{
            background: "var(--card)",
            color: "var(--text)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid var(--border)",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
