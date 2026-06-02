"use client";

import { useEffect, useState } from "react";
import useTimer from "../hooks/useTimer";
import Controls from "./Controls";
import Settings from "./Settings";
import Timer from "./Timer";
import MiniToggle from "./MiniToggle";
import Stats from "./Stats";
import AuthModal from "./AuthModal";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/navigation/Navbar";
import { useTimerSettings } from "@/context/TimerSettingsContext";
import useUserSettings from "@/hooks/useUserSettings";
import TimerPresets from "@/components/TimerPresets";
import SettingsModal from "./SettingsModal";
import LofiPlayer from "./LofiPlayer";
import TodayCard from "./cards/TodayCard";
import StatsCard from "./cards/StatsCard";
import RankCard from "./RankCard";
import QuoteCard from "./cards/QuoteCard";
import { usePathname } from "next/navigation";

export default function TimerPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isMini, setIsMini] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("isMini") === "true"
      : false,
  );

  const [isDesktop, setIsDesktop] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);

  const { settings } = useTimerSettings();

  const { saveSettings } = useUserSettings(user);

  const [profile, setProfile] = useState<any>(null);

  const [showSettings, setShowSettings] = useState(false);

  const handleFocusComplete = async (minutes: number, wasStrict: boolean) => {
    if (!user) {
      console.log("❌ no user, skipping session save");
      return;
    }

    try {
      const res = await fetch("/api/complete-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: minutes * 60, rankMode: wasStrict }),
      });

      const data = await res.json();
      console.log("✅ response:", data);

      router.refresh(); // refresh server data (XP, rank, etc.)
    } catch (err) {
      console.error("Session completion error:", err);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);

      if (data.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profileData }) => setProfile(profileData));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData }) => setProfile(profileData));
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const {
    focusMinutes,
    breakMinutes,
    timeLeft,
    mode,
    isRunning,
    isPaused,
    rankMode,
    sessionsToday,
    DAILY_GOAL,
    goalProgress,
    goalCompleted,
    longBreakMinutes,
    isTransitioning,
    rankUpMessage,
    start,
    pause,
    skip,
    reset,
  } = useTimer({ onFocusComplete: handleFocusComplete });

  const pathname = usePathname();

  useEffect(() => {
    if (isRunning) {
      pause();
    }
  }, [pathname]);

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
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* NAVBAR */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        onSave={saveSettings}
      />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 justify-center items-start px-4 pt-4 pb-28">
        <div
          className="flex w-full max-w-3xl gap-4 items-start justify-center"
          style={{
            transform: isDesktop ? "scale(1.1)" : "scale(1)",
            transformOrigin: "top center",
          }}
        >
          {/* MOBILE: stack vertically, DESKTOP: side by side */}
          <div className="flex flex-col lg:flex-row w-full gap-4 items-start justify-center">
            {/* LEFT = TIMER */}
            <div className="flex flex-col items-center gap-4 flex-1 w-full">
              <Timer
                timeLeft={timeLeft}
                mode={mode}
                focusMinutes={focusMinutes}
                breakMinutes={breakMinutes}
                longBreakMinutes={longBreakMinutes}
                isMini={isMini}
                isRunning={isRunning}
              />

              {rankMode && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background:
                      "color-mix(in srgb, var(--ring) 15%, transparent)",
                    color: "var(--ring)",
                    border:
                      "1px solid color-mix(in srgb, var(--ring) 30%, transparent)",
                  }}
                >
                  🏆 Rank Mode — +50% XP
                </div>
              )}

              <TimerPresets
                isRunning={isRunning}
                isPaused={isPaused}
                onOpenSettings={() => setShowSettings(true)}
              />

              <Controls
                isRunning={isRunning}
                rankMode={rankMode}
                isTransitioning={isTransitioning}
                start={start}
                pause={pause}
                skip={skip}
                reset={reset}
              />

              <QuoteCard />
            </div>

            {/* RIGHT = CARDS — below timer on mobile, side by side on desktop */}
            {!isMini && user && (
              <div className="w-full lg:w-[220px] flex flex-col gap-5">
                <TodayCard
                  goalProgress={goalProgress}
                  DAILY_GOAL={DAILY_GOAL}
                  goalCompleted={goalCompleted}
                />
                <StatsCard
                  sessions={sessionsToday}
                  focusMinutes={sessionsToday * focusMinutes}
                  streak={profile?.streak ?? 0}
                />
                <RankCard
                  points={profile?.points ?? 0}
                  completedSessions={profile?.completed_sessions ?? 0}
                  size="small"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Rank Up Toast */}
      {rankUpMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-medium animate-bounce"
          style={{
            background: "var(--card)",
            color: "var(--text)",
            boxShadow: "var(--shadow)",
          }}
        >
          🎉 You reached {rankUpMessage}!
        </div>
      )}

      <LofiPlayer />

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
