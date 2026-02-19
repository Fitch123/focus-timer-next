"use client";

import { useEffect, useState } from "react";
import useTimer from "../hooks/useTimer";
import Controls from "./Controls";
import Settings from "./Settings";
import Timer from "./Timer";
import MiniToggle from "./MiniToggle";
import Stats from "./Stats";
import { supabase } from "../lib/supabase";

interface TimerPageProps {
  openLogin: () => void;
}

export default function TimerPage({ openLogin }: TimerPageProps) {
  const [user, setUser] = useState<any | null>(null);
  const [isMini, setIsMini] = useState<boolean>(
    () => localStorage.getItem("isMini") === "true",
  );
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const {
    focusMinutes,
    breakMinutes,
    timeLeft,
    mode,
    isRunning,
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
  } = useTimer();

  useEffect(() => {
    localStorage.setItem("isMini", isMini.toString());
  }, [isMini]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="h-screen relative flex items-center justify-center transition-all">
      {/* AUTH BUTTON */}
      <div className="absolute top-4 right-4">
        <button
          onClick={user ? () => supabase.auth.signOut() : openLogin}
          className="px-4 py-2 text-white bg-red-600 rounded-full hover:bg-red-700 transition"
        >
          {user ? "Log out" : "Sign in"}
        </button>
      </div>

      <div
        className={`flex flex-col items-center transition-all ${isMini ? "gap-2 max-w-xs" : "gap-6 max-w-xl"}`}
      >
        <Timer
          timeLeft={timeLeft}
          mode={mode}
          focusMinutes={focusMinutes}
          breakMinutes={breakMinutes}
          isMini={isMini}
          streak={streak}
          bestStreak={bestStreak}
        />

        <Controls
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          resetTimer={resetTimer}
        />

        {!isMini && (
          <Settings
            isRunning={isRunning}
            increaseFocus={increaseFocus}
            decreaseFocus={decreaseFocus}
            increaseBreak={increaseBreak}
            decreaseBreak={decreaseBreak}
          />
        )}

        <MiniToggle isMini={isMini} setIsMini={setIsMini} />

        {/* Stats */}
        <Stats sessions={sessions} streak={streak} bestStreak={bestStreak} />

        <div className="mt-4 text-sm text-gray-400 text-center">
          {goalCompleted ? (
            <span className="text-green-400 font-semibold">
              🎉 Daily goal completed!
            </span>
          ) : (
            <span>
              Sessions today: {goalProgress} / {DAILY_GOAL}
            </span>
          )}
        </div>

        <div className="w-full h-2 bg-gray-700 rounded mt-2">
          <div
            className="h-2 bg-green-500 rounded transition-all"
            style={{ width: `${(goalProgress / DAILY_GOAL) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
