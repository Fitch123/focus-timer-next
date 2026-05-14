import TimerRing from "./TimerRing";

interface TimerProps {
  timeLeft: number;
  mode: "focus" | "break" | "longBreak";
  focusMinutes: number;
  breakMinutes: number;
  isMini: boolean;
  longBreakMinutes?: number;
  isRunning?: boolean;
}

export default function Timer({
  timeLeft,
  mode,
  focusMinutes,
  breakMinutes,
  isMini,
  longBreakMinutes,
  isRunning,
}: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = ("0" + (timeLeft % 60)).slice(-2);

  const modeLabel =
    mode === "focus"
      ? "Focus Session"
      : mode === "break"
        ? "Short Break"
        : "Long Break";

  // ✅ correct total time based on mode
  const totalSeconds =
    mode === "focus"
      ? focusMinutes * 60
      : mode === "break"
        ? breakMinutes * 60
        : (longBreakMinutes ?? 0) * 60;

  // ✅ progress goes from 0 → 1
  const progress = 1 - timeLeft / totalSeconds;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* MODE LABEL */}
      <p
        className="text-xs font-bold uppercase tracking-[0.2em] mb-6"
        style={{ color: "var(--accent)" }}
      >
        {modeLabel}
      </p>

      {/* RING + TIMER */}
      <div className="relative flex items-center justify-center">
        <TimerRing progress={progress} isRunning={isRunning} size={320} />

        <div className="absolute flex flex-col items-center justify-center gap-2">
          <h1
            className={`tabular-nums font-light tracking-tight ${isMini ? "text-4xl" : "text-[80px]"}`}
            style={{ color: "var(--text)" }}
          >
            {minutes}:{seconds}
          </h1>

          {!isMini && (
            <p className="text-sm text-center" style={{ color: "var(--text)" }}>
              {focusMinutes}m Focus · {breakMinutes}m Break · {longBreakMinutes}
              m Long
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
