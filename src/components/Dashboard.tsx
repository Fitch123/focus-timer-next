"use client";

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Timer from "../components/Timer";
import Stats from "../components/Stats";
import useTimer from "../hooks/useTimer";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState<any[]>([]);

  // Pull timer state from your custom hook
  const { timeLeft, mode, focusMinutes, breakMinutes, streak, bestStreak } =
    useTimer();

  const fetchSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (!error) {
      setSessions(data || []);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  return (
    <div>
      <Timer
        timeLeft={timeLeft}
        mode={mode}
        focusMinutes={focusMinutes}
        breakMinutes={breakMinutes}
        isMini={false}
        streak={streak}
        bestStreak={bestStreak}
      />

      <Stats
        sessions={sessions.length} // number
        streak={streak} // number
        bestStreak={bestStreak} // number
      />
    </div>
  );
}
