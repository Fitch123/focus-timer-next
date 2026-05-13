import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type SessionRow = {
  duration: number;
  completed_at: string;
};

export default function useAnalytics(days: 7 | 30) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const supabase = createClient();
      const from = new Date();
      from.setDate(from.getDate() - days);

      const { data } = await supabase
        .from("sessions") // ✅ correct table
        .select("duration, completed_at") // ✅ correct column
        .eq("completed", true) // ✅ only completed sessions
        .gte("completed_at", from.toISOString())
        .order("completed_at", { ascending: true });

      setSessions(data ?? []);
      setLoading(false);
    };

    fetch();
  }, [days]);

  // Sessions per day
  const sessionsPerDay = sessions.reduce<Record<string, number>>((acc, s) => {
    const day = s.completed_at.split("T")[0];
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});

  // Focus time per day
  const focusTimePerDay = sessions.reduce<Record<string, number>>((acc, s) => {
    const day = s.completed_at.split("T")[0];
    acc[day] = (acc[day] ?? 0) + Math.round(s.duration / 60); // ✅ convert to minutes
    return acc;
  }, {});

  // Total focus time
  const totalFocusMinutes = sessions.reduce(
    (acc, s) => acc + Math.round(s.duration / 60), // ✅ convert to minutes
    0,
  );

  // Average session length
  const avgSessionLength = sessions.length
    ? Math.round(totalFocusMinutes / sessions.length)
    : 0;

  // Streak
  const streak = calcStreak(sessions);

  return {
    sessions,
    loading,
    sessionsPerDay,
    focusTimePerDay,
    totalFocusMinutes,
    avgSessionLength,
    streak,
  };
}

function calcStreak(sessions: SessionRow[]) {
  const days = new Set(sessions.map((s) => s.completed_at.split("T")[0]));
  let streak = 0;
  const today = new Date();

  while (true) {
    const day = today.toISOString().split("T")[0];
    if (days.has(day)) {
      streak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
