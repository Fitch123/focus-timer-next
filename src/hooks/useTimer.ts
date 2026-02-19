import { useState, useEffect, useRef } from "react";
import useLocalStorage from "./useLocalStorage";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import confetti from "canvas-confetti";

interface Session {
  completed_at: string;
  duration?: number;
}

interface UseTimerReturn {
  mode: "focus" | "break";
  timeLeft: number;
  isRunning: boolean;
  focusMinutes: number;
  breakMinutes: number;
  sessions: number;
  DAILY_GOAL: number;
  goalProgress: number;
  goalCompleted: boolean;
  streak: number;
  bestStreak: number;
  setIsRunning: (value: boolean | ((prev: boolean) => boolean)) => void;
  resetTimer: () => void;
  increaseFocus: () => void;
  decreaseFocus: () => void;
  increaseBreak: () => void;
  decreaseBreak: () => void;
  loadTodaySessions: () => Promise<number>;
}

export default function useTimer(): UseTimerReturn {
  const [mode, setMode] = useLocalStorage<"focus" | "break">("mode", "focus");
  const [focusMinutes, setFocusMinutes] = useLocalStorage<number>(
    "focusMinutes",
    25,
  );
  const [breakMinutes, setBreakMinutes] = useLocalStorage<number>(
    "breakMinutes",
    5,
  );
  const [timeLeft, setTimeLeft] = useLocalStorage<number>(
    "timeLeft",
    focusMinutes * 60,
  );
  const [isRunning, setIsRunning] = useState(false);

  const [sessions, setSessions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const DAILY_GOAL = 6;
  const goalProgress = Math.min(sessions, DAILY_GOAL);
  const goalCompleted = sessions >= DAILY_GOAL;

  const hasCompletedRef = useRef(false);
  const { user } = useAuth();
  const userRef = useRef<typeof user>(null);

  useEffect(() => setIsRunning(false), []);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? focusMinutes * 60 : breakMinutes * 60);
  };

  function notify(nextMode: "focus" | "break") {
    const sound = nextMode === "focus" ? "/focusBell.mp3" : "/breakBell.mp3";
    new Audio(sound).play().catch(() => {});
  }

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  console.log("user from useAuth:", user);

  useEffect(() => {
    if (!isRunning) return;

    hasCompletedRef.current = false;
    const currentMode = mode;
    const currentDuration = focusMinutes;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;

            const liveUser = userRef.current; // ✅ always the latest value
            console.log("🟡 liveUser at completion:", liveUser);

            if (currentMode === "focus" && liveUser) {
              supabase
                .from("sessions")
                .insert({
                  user_id: liveUser.id,
                  duration: currentDuration,
                  completed_at: new Date().toISOString(),
                })
                .then(({ error, status }) => {
                  console.log("🔵 Insert result:", { error, status });
                  if (!error) {
                    setSessions((prev) => {
                      const newCount = prev + 1;
                      if (newCount >= DAILY_GOAL) celebrateGoal();
                      return newCount;
                    });
                    calculateStreak();
                  }
                });
            }

            // switch mode
            if (currentMode === "focus") {
              notify("break");
              setMode("break");
              setTimeLeft(breakMinutes * 60);
            } else {
              notify("focus");
              setMode("focus");
              setTimeLeft(focusMinutes * 60);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, focusMinutes, breakMinutes]); // user removed from deps — we use the ref instead

  useEffect(() => {
    if (mode === "break" && timeLeft === 5) {
      new Audio("/countdown.mp3").play().catch(() => {});
    }
  }, [timeLeft, mode]);

  function increaseFocus() {
    if (isRunning || mode !== "focus") return;
    setFocusMinutes((prev) => Math.min(90, prev + 5));
    setTimeLeft((prev) => prev + 5 * 60);
  }

  function decreaseFocus() {
    if (isRunning || mode !== "focus") return;
    setFocusMinutes((prev) => Math.max(5, prev - 5));
    setTimeLeft((prev) => Math.max(300, prev - 5 * 60));
  }

  function increaseBreak() {
    if (isRunning) return;
    setBreakMinutes((prev) => Math.min(30, prev + 5));
  }

  function decreaseBreak() {
    if (isRunning) return;
    setBreakMinutes((prev) => Math.max(5, prev - 5));
  }

  function celebrateGoal() {
    new Audio("/achivementSound.mp3").play().catch(() => {});
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  async function loadTodaySessions() {
    if (!user) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", today.toISOString());

    if (error) console.error("Load sessions error:", error);

    setSessions(count ?? 0);
    return count ?? 0;
  }

  useEffect(() => {
    if (user) loadTodaySessions();
  }, [user]);

  async function calculateStreak() {
    if (!user) return;
    const { data, error } = await supabase
      .from("sessions")
      .select("completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (error) return console.error(error);

    const streakCount = computeStreak(data ?? []);
    setStreak(streakCount);
    setBestStreak((prev) => Math.max(prev, streakCount));
  }

  function computeStreak(sessions: Session[]): number {
    if (!sessions.length) return 0;

    const dates = [
      ...new Set(sessions.map((s) => new Date(s.completed_at).toDateString())),
    ];
    let streakCount = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (dates[0] !== currentDate.toDateString())
      currentDate.setDate(currentDate.getDate() - 1);

    for (const dateStr of dates) {
      const sessionDate = new Date(dateStr);
      if (sessionDate.toDateString() === currentDate.toDateString()) {
        streakCount++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else break;
    }

    return streakCount;
  }

  useEffect(() => {
    if (user) calculateStreak();
  }, [user]);

  return {
    mode,
    timeLeft,
    isRunning,
    focusMinutes,
    breakMinutes,
    sessions,
    DAILY_GOAL,
    goalProgress,
    goalCompleted,
    streak,
    bestStreak,
    setIsRunning,
    resetTimer,
    increaseFocus,
    decreaseFocus,
    increaseBreak,
    decreaseBreak,
    loadTodaySessions,
  };
}
