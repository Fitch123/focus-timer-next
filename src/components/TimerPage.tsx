"use client";

import { useEffect, useState } from "react";
import useTimer from "../hooks/useTimer";
import Controls from "./Controls";
import Settings from "./Settings";
import Timer from "./Timer";
import MiniToggle from "./MiniToggle";
import Stats from "./Stats";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal"; // import your modal
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function TimerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMini, setIsMini] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("isMini") === "true",
  );
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    loadTodaySessions,
  } = useTimer();

  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("isMini", isMini.toString());
  }, [isMini]);

  // Listen to auth changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Wrap in an async IIFE
        (async () => {
          await loadTodaySessions();
        })();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  return (
    <div className="h-screen relative flex items-center justify-center transition-all">
      {/* AUTH BUTTON */}
      <div className="absolute top-4 right-4">
        <button
          onClick={user ? handleLogout : () => setShowAuthModal(true)}
          className="px-4 py-2 text-white bg-red-600 rounded-full hover:bg-red-700 transition"
        >
          {user ? "Log out" : "Sign in"}
        </button>
      </div>

      {/* TIMER AND STATS */}
      <div
        className={`flex flex-col items-center transition-all ${
          isMini ? "gap-2 max-w-xs" : "gap-6 max-w-xl"
        }`}
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

      <button
        className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        onClick={() => router.push("/pricing")}
      >
        Upgrade to Pro
      </button>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
