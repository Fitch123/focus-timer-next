import { useState, useEffect, useRef } from "react";
import useLocalStorage from "./useLocalStorage";
import confetti from "canvas-confetti";

interface UseTimerOptions {
  onFocusComplete?: (durationMinutes: number) => void;
}

export default function useTimer({ onFocusComplete }: UseTimerOptions = {}) {
  const [mode, setMode] = useLocalStorage<"focus" | "break">("mode", "focus");
  const [focusMinutes, setFocusMinutes] = useLocalStorage("focusMinutes", 25);
  const [breakMinutes, setBreakMinutes] = useLocalStorage("breakMinutes", 5);
  const [timeLeft, setTimeLeft] = useLocalStorage(
    "timeLeft",
    focusMinutes * 60,
  );

  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);

  const DAILY_GOAL = 5;
  const goalProgress = Math.min(sessionsToday, DAILY_GOAL);
  const goalCompleted = sessionsToday >= DAILY_GOAL;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Reset when mode changes manually
  useEffect(() => {
    setTimeLeft(mode === "focus" ? focusMinutes * 60 : breakMinutes * 60);
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;

    hasCompletedRef.current = false;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  function handleCompletion() {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    setIsRunning(false);

    if (mode === "focus") {
      setSessionsToday((prev) => {
        const updated = prev + 1;
        if (updated === DAILY_GOAL) celebrateGoal();
        return updated;
      });

      onFocusComplete?.(focusMinutes);
      notify("break");
      setMode("break");
    } else {
      notify("focus");
      setMode("focus");
    }
  }

  function notify(nextMode: "focus" | "break") {
    const sound = nextMode === "focus" ? "/focusBell.mp3" : "/breakBell.mp3";
    new Audio(sound).play().catch(() => {});
  }

  function celebrateGoal() {
    new Audio("/achivementSound.mp3").play().catch(() => {});
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? focusMinutes * 60 : breakMinutes * 60);
  }

  function increaseFocus() {
    if (isRunning || mode !== "focus") return;
    setFocusMinutes((prev) => Math.min(90, prev + 5));
  }

  function decreaseFocus() {
    if (isRunning || mode !== "focus") return;
    setFocusMinutes((prev) => Math.max(5, prev - 5));
  }

  function increaseBreak() {
    if (isRunning) return;
    setBreakMinutes((prev) => Math.min(30, prev + 5));
  }

  function decreaseBreak() {
    if (isRunning) return;
    setBreakMinutes((prev) => Math.max(5, prev - 5));
  }

  return {
    mode,
    timeLeft,
    isRunning,
    focusMinutes,
    breakMinutes,
    sessionsToday,
    DAILY_GOAL,
    goalProgress,
    goalCompleted,
    setIsRunning,
    resetTimer,
    increaseFocus,
    decreaseFocus,
    increaseBreak,
    decreaseBreak,
  };
}
