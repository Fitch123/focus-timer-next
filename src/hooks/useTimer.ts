import { useState, useEffect, useRef, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";
import confetti from "canvas-confetti";
import { useTimerSettings } from "../context/TimerSettingsContext";
import { getRankProgress } from "@/lib/ranks";
import { createClient } from "@/utils/supabase/client";

interface UseTimerOptions {
  onFocusComplete?: (durationMinutes: number, rankMode: boolean) => void;
}

export default function useTimer({ onFocusComplete }: UseTimerOptions = {}) {
  const [mode, setMode] = useLocalStorage<"focus" | "break" | "longBreak">(
    "mode",
    "focus",
  );
  const { settings, updateSettings } = useTimerSettings();

  const focusMinutes = settings.focus;
  const breakMinutes = settings.breakTime;
  const longBreakMinutes = settings.longBreak;

  const [isRunning, setIsRunning] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingOnPause, setRemainingOnPause] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(() => focusMinutes * 60);

  const autoStartBreak = settings.autoStartBreak;
  const autoStartFocus = settings.autoStartFocus;

  const rankMode = settings.rankMode;

  const alarmSound = settings.alarmSound;
  const alarmVolume = settings.alarmVolume;
  const notificationsEnabled = settings.notificationsEnabled ?? true;

  const [sessionsToday, setSessionsToday] = useState(0);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [rankUpMessage, setRankUpMessage] = useState<string | null>(null);

  const DAILY_GOAL = settings.dailyGoal ?? 4;
  const goalProgress = Math.min(sessionsToday, DAILY_GOAL);
  const goalCompleted = sessionsToday >= DAILY_GOAL;
  const confettiEnabled = settings.confettiEnabled;

  // Refs for intervals and guards
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownPlayedRef = useRef(false);
  const completionHandledRef = useRef(false);
  const autoStartRef = useRef(false);
  const autoStartBreakRef = useRef(autoStartBreak);
  const autoStartFocusRef = useRef(autoStartFocus);
  const alarmVolumeRef = useRef(alarmVolume);
  const alarmSoundRef = useRef(alarmSound);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiEnabledRef = useRef(confettiEnabled);

  const MIN_MINUTES = 5;
  const MAX_FOCUS_MINUTES = 90;
  const MAX_BREAK_MINUTES = 30;
  const MIN_SECONDS = MIN_MINUTES * 60;
  const LONG_BREAK_INTERVAL = settings.longBreakInterval ?? 4;

  const getDurationMs = () => {
    if (mode === "focus") return focusMinutes * 60 * 1000;
    if (mode === "break") return breakMinutes * 60 * 1000;
    return longBreakMinutes * 60 * 1000;
  };

  // ▶️ Start timer
  const start = () => {
    if (isRunning) return;

    if (countdownAudioRef.current) {
      // ✅ sync audio position to remaining time
      const remainingSeconds = Math.ceil(remainingOnPause / 1000);
      const countdownDuration = countdownAudioRef.current.duration;
      if (!isNaN(countdownDuration)) {
        countdownAudioRef.current.currentTime =
          countdownDuration - remainingSeconds;
      }
      countdownAudioRef.current.play().catch(() => {});
    }

    completionHandledRef.current = false;
    if (!countdownAudioRef.current) {
      countdownPlayedRef.current = false;
    }

    const duration = remainingOnPause || getDurationMs();
    setEndTime(Date.now() + duration);
    setRemainingOnPause(0);
    setIsRunning(true);
  };

  // ✅ Handle session completion (focus or break)
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      e.preventDefault();
      if (isRunning) pause();
      else start();
    };

    document.addEventListener("keydown", handleSpace);
    return () => document.removeEventListener("keydown", handleSpace);
  }, [isRunning]);

  const startRef = useRef(start);

  const notificationsEnabledRef = useRef(notificationsEnabled);

  // Sync alarmVolume to ref
  useEffect(() => {
    alarmVolumeRef.current = alarmVolume;
  }, [alarmVolume]);

  // Sync auto-start settings to refs
  useEffect(() => {
    autoStartBreakRef.current = autoStartBreak;
  }, [autoStartBreak]);

  // Sync auto-start settings to refs
  useEffect(() => {
    autoStartFocusRef.current = autoStartFocus;
  }, [autoStartFocus]);

  // Keep startRef in sync
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  // ⏸ Pause
  const pause = () => {
    if (!isRunning || !endTime) return;

    if (countdownAudioRef.current) {
      // ✅ pause but keep it
      countdownAudioRef.current.pause();
    }

    const remaining = Math.max(0, endTime - Date.now());
    setRemainingOnPause(remaining);
    setEndTime(null);
    setIsRunning(false);
  };

  // Helper
  const getMinutesForMode = () => {
    if (mode === "focus") return focusMinutes;
    if (mode === "break") return breakMinutes;
    return longBreakMinutes;
  };

  // ⏭ Skip
  const skip = () => {
    if (rankMode) return;
    handleCompletion(true, false);
  };

  const reset = () => {
    if (rankMode && isRunning) return;

    if (countdownAudioRef.current) {
      // ✅ fully stop on reset
      countdownAudioRef.current.pause();
      countdownAudioRef.current.currentTime = 0;
      countdownAudioRef.current = null;
    }

    setIsRunning(false);
    setEndTime(null);
    setRemainingOnPause(0);
    setTimeLeft(getMinutesForMode() * 60);
  };

  // ✅ Fetch user ID on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const checkRankUp = useCallback(async () => {
    if (!userId) return;

    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("points, completed_sessions, rank")
      .eq("id", userId)
      .single();

    if (profile) {
      const { currentRank, isUnranked } = getRankProgress(
        profile.points,
        profile.completed_sessions,
      );

      if (isUnranked) return;

      if (profile.rank && currentRank !== profile.rank) {
        setRankUpMessage(currentRank);
        new Audio("/achievementSound.mp3").play().catch(() => {});
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
        await supabase
          .from("profiles")
          .update({ rank: currentRank })
          .eq("id", userId);
        setTimeout(() => setRankUpMessage(null), 4000);
      }
    }
  }, [userId]);

  // 🧠 Completion
  const handleCompletion = useCallback(
    (silent = false, counted = true) => {
      setIsRunning(false);
      setEndTime(null);
      setRemainingOnPause(0);
      setIsTransitioning(true);

      // ✅ clear countdown audio on completion
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current.currentTime = 0;
        countdownAudioRef.current = null;
      }

      if (mode === "focus") {
        const updated = counted ? sessionsToday + 1 : sessionsToday;
        const nextMode = counted
          ? updated % LONG_BREAK_INTERVAL === 0
            ? "longBreak"
            : "break"
          : "break";

        setSessionsToday(updated);
        setMode(nextMode);

        if (rankMode) {
          updateSettings({ rankMode: false });
        }

        if (autoStartBreakRef.current) {
          autoStartRef.current = true;
        }

        if (!silent) {
          if (updated === DAILY_GOAL) {
            celebrateGoal();
          } else {
            notify(nextMode);
            if (confettiEnabledRef.current) {
              confetti({ particleCount: 100, spread: 50, origin: { y: 0.6 } });
            }
          }
        }

        if (counted) {
          onFocusComplete?.(focusMinutes, rankMode);
          checkRankUp();
        }
      } else {
        if (!silent) {
          const audio = new Audio("/focusBell.mp3");
          audio.volume = alarmVolumeRef.current;
          audio.play().catch(() => {});

          if (
            notificationsEnabledRef.current &&
            Notification.permission === "granted"
          ) {
            new Notification("🎯 Time to Focus!", {
              body: "Break's over, back to work!",
              icon: "/icon.png",
            });
          }
        }
        setMode("focus");
        if (autoStartFocusRef.current) autoStartRef.current = true;
      }
    },
    [
      mode,
      sessionsToday,
      focusMinutes,
      onFocusComplete,
      LONG_BREAK_INTERVAL,
      DAILY_GOAL,
      rankMode,
      updateSettings,
      checkRankUp,
    ],
  );

  // ⏱ Tick effect
  useEffect(() => {
    if (!isRunning || !endTime) return;

    // 🧹 Always clear previous interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      const seconds = Math.max(0, Math.ceil(remaining / 1000));

      setTimeLeft(seconds);

      // 🔔 Countdown sound
      if (
        seconds === 5 &&
        !countdownPlayedRef.current &&
        (mode === "break" || mode === "longBreak")
      ) {
        const countdown = new Audio("/countdown.mp3");
        countdown.volume = alarmVolumeRef.current;
        countdownAudioRef.current = countdown;
        countdown.play().catch(() => {});
        countdownPlayedRef.current = true;
      }

      // ✅ Completion guard
      if (remaining <= 0 && !completionHandledRef.current) {
        completionHandledRef.current = true;

        clearInterval(intervalRef.current!);
        intervalRef.current = null;

        setTimeLeft(0);
        handleCompletion();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, endTime, mode, handleCompletion]);

  useEffect(() => {
    countdownPlayedRef.current = false;
  }, [mode]);

  // ✅ Fix — don't overwrite if we have a paused remainder
  useEffect(() => {
    if (isRunning) return;
    if (remainingOnPause) return; // ✅ add this guard

    if (mode === "focus") setTimeLeft(settings.focus * 60);
    if (mode === "break") setTimeLeft(settings.breakTime * 60);
    if (mode === "longBreak") setTimeLeft(settings.longBreak * 60);
  }, [
    settings.focus,
    settings.breakTime,
    settings.longBreak,
    mode,
    isRunning,
    remainingOnPause,
  ]);

  // ✅ Auto-start effect
  useEffect(() => {
    if (autoStartRef.current) {
      autoStartRef.current = false;
      setIsTransitioning(true);

      setTimeout(() => {
        startRef.current();
        setIsTransitioning(false);
      }, 300);
    }
  }, [mode]);

  // Save timer state on every tick
  useEffect(() => {
    if (!isRunning || !endTime) return;
    localStorage.setItem(
      "timer-state",
      JSON.stringify({
        mode,
        endTime,
        sessionsToday,
      }),
    );
  }, [endTime, isRunning, mode, sessionsToday]);

  useEffect(() => {
    const saved = localStorage.getItem("timer-state");
    if (!saved) return;

    const {
      mode: savedMode,
      endTime: savedEndTime,
      sessionsToday: savedSessions,
    } = JSON.parse(saved);
    const remaining = savedEndTime - Date.now();

    if (remaining > 0) {
      setMode(savedMode);
      setSessionsToday(savedSessions);
      setRemainingOnPause(remaining);
      setTimeLeft(Math.ceil(remaining / 1000));
    } else {
      localStorage.removeItem("timer-state");
    }
  }, []);

  // ✅ Sync notificationsEnabled to ref
  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  const soundMap: Record<string, string> = {
    focus: "/focusBell.mp3",
    digital: "/digitalBell.mp3",
    clock: "/clockBell.mp3",
    bell: "handBell.mp3",
    school: "/schoolBell.mp3",
  };

  // 🔔 Sound
  function notify(nextMode: "focus" | "break" | "longBreak") {
    const soundFile = soundMap[alarmSoundRef.current] ?? "/focusBell.mp3";
    const audio = new Audio(soundFile);
    audio.volume = alarmVolumeRef.current;
    audio.play().catch(() => {});

    console.log("🔔 notify fired");
    console.log("notificationsEnabledRef:", notificationsEnabledRef.current);
    console.log("Notification.permission:", Notification.permission);

    if (
      notificationsEnabledRef.current &&
      Notification.permission === "granted"
    ) {
      // ✅
      const title =
        nextMode === "focus"
          ? "🎯 Time to Focus!"
          : nextMode === "break"
            ? "☕ Take a Break!"
            : "🌴 Long Break Time!";

      const body =
        nextMode === "focus"
          ? "Break's over, back to work!"
          : "Great job! You earned a rest.";

      new Notification(title, { body, icon: "/icon.png" });
    }
  }

  // 🎉 Celebration
  function celebrateGoal() {
    const audio = new Audio("/cheeringSound.mp3");
    audio.volume = alarmVolumeRef.current;
    audio.play().catch(() => {});

    if (confettiEnabledRef.current) {
      confetti({ particleCount: 350, spread: 100, origin: { y: 0.6 } }); // ✅ big
    }
  }

  // ⏫ Adjust time safely
  function adjustTime(minutesDelta: number) {
    const deltaMs = minutesDelta * 60 * 1000;
    const deltaSeconds = minutesDelta * 60;

    const maxMinutes = mode === "focus" ? MAX_FOCUS_MINUTES : MAX_BREAK_MINUTES;

    const maxSeconds = maxMinutes * 60;

    if (isRunning && endTime) {
      const remainingMs = Math.max(0, endTime - Date.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      const newSeconds = Math.min(
        maxSeconds,
        Math.max(MIN_SECONDS, remainingSeconds + deltaSeconds),
      );

      const newMs = newSeconds * 1000;

      setEndTime(Date.now() + newMs);
    } else if (!isRunning && remainingOnPause) {
      const remainingSeconds = Math.ceil(remainingOnPause / 1000);

      const newSeconds = Math.min(
        maxSeconds,
        Math.max(MIN_SECONDS, remainingSeconds + deltaSeconds),
      );

      setRemainingOnPause(newSeconds * 1000);
      setTimeLeft(newSeconds);
    } else {
      // Idle — sync effect will handle timeLeft
      const baseSeconds = getMinutesForMode() * 60;

      const newSeconds = Math.min(
        maxSeconds,
        Math.max(MIN_SECONDS, baseSeconds + deltaSeconds),
      );

      setTimeLeft(newSeconds);
    }
  }

  function increaseFocus() {
    const newFocus = Math.min(settings.focus + 5, 90);

    updateSettings({
      focus: newFocus,
    });

    if (mode === "focus") adjustTime(5);
  }

  function decreaseFocus() {
    const newFocus = Math.max(settings.focus - 5, 5);

    updateSettings({
      focus: newFocus,
    });

    if (mode === "focus") adjustTime(-5);
  }

  function increaseBreak() {
    const newBreak = Math.min(settings.breakTime + 5, 30);

    updateSettings({
      breakTime: newBreak,
    });

    if (mode === "break" || mode === "longBreak") adjustTime(5);
  }

  function decreaseBreak() {
    const newBreak = Math.max(5, settings.breakTime - 5);

    updateSettings({
      breakTime: newBreak,
    });

    if (mode === "break" || mode === "longBreak") {
      adjustTime(-5);
    }
  }
  function updateLongBreak(minutes: number) {
    updateSettings({
      longBreak: minutes,
    });

    if (mode === "longBreak" && !isRunning && !remainingOnPause) {
      setTimeLeft(minutes * 60);
    }
  }

  // 🗓 Daily reset at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setSessionsToday(0);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // 🔔 Notification permission request
  useEffect(() => {
    if (notificationsEnabled && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  // ✅ Sync confettiEnabled to ref
  useEffect(() => {
    confettiEnabledRef.current = confettiEnabled;
  }, [confettiEnabled]);

  return {
    mode,
    timeLeft,
    isPaused: !isRunning && remainingOnPause > 0,
    isRunning,
    focusMinutes,
    breakMinutes,
    longBreakMinutes,

    autoStartBreak,
    autoStartFocus,
    rankMode,
    alarmSound,
    alarmVolume,
    notificationsEnabled,
    isTransitioning,

    sessionsToday,
    DAILY_GOAL,
    goalProgress,
    goalCompleted,
    rankUpMessage,

    start,
    pause,
    skip,
    reset,

    increaseFocus,
    decreaseFocus,
    increaseBreak,
    decreaseBreak,
    updateLongBreak,
  };
}
