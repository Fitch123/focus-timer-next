interface TimerProps {
  timeLeft: number;
  mode: "focus" | "break";
  focusMinutes: number;
  breakMinutes: number;
  isMini: boolean;
  user?: any;
  onSessionComplete?: () => void;
}

export default function Timer({
  timeLeft,
  mode,
  focusMinutes,
  breakMinutes,
  isMini,
}: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = ("0" + (timeLeft % 60)).slice(-2);

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm uppercase tracking-wide text-gray-400 mb-1">
        {mode}
      </p>
      <h1
        className={`font-bold tabular-nums ${mode === "break" ? "text-green-600" : "text-black-600"} ${isMini ? "text-3xl" : "text-6xl"}`}
      >
        {minutes}:{seconds}
      </h1>
      {!isMini && (
        <p className="text-sm text-gray-400 mt-2">
          Focus: {focusMinutes} min · Break: {breakMinutes} min
        </p>
      )}
    </div>
  );
}
