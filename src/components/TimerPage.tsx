"use client";

import { useEffect, useState } from "react";
import useTimer from "../hooks/useTimer";
import Controls from "./Controls";
import Settings from "./Settings";
import Timer from "./Timer";
import MiniToggle from "./MiniToggle";
import Stats from "./Stats";
import AuthModal from "./AuthModal";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function TimerPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isMini, setIsMini] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("isMini") === "true"
      : false,
  );
  const [showAuthModal, setShowAuthModal] = useState(false);

  /*
    🔥 This is the important part:
    Connect timer to backend XP logic
  */
  const handleFocusComplete = async (minutes: number) => {
    if (!user) return;

    try {
      await fetch("/api/complete-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: minutes * 60 }),
      });

      router.refresh(); // refresh server data (XP, rank, etc.)
    } catch (err) {
      console.error("Session completion error:", err);
    }
  };

  const {
    focusMinutes,
    breakMinutes,
    timeLeft,
    mode,
    isRunning,
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
  } = useTimer({ onFocusComplete: handleFocusComplete });

  /* Persist mini mode */
  useEffect(() => {
    localStorage.setItem("isMini", isMini.toString());
  }, [isMini]);

  /* Auth listener */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
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

      {/* MAIN CONTENT */}
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

        <Stats sessions={sessionsToday} />

        {/* Daily Goal */}
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

        {/* Upgrade */}
        <button
          className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          onClick={() => router.push("/pricing")}
        >
          Upgrade to Pro
        </button>
      </div>

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
