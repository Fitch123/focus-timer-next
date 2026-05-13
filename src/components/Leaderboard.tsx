"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import RankCard from "./RankCard";

type LeaderboardEntry = {
  id: string;
  username: string;
  avatar_url: string;
  points: number; // total XP — used for RankCard
  periodPoints?: number; // session pts this week/month — used for display
  rank: string;
  completed_sessions: number;
};

export default function Leaderboard({ user }: { user: User }) {
  const supabase = createClient();
  const [range, setRange] = useState<"alltime" | "weekly" | "monthly">(
    "alltime",
  );
  const [top10, setTop10] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<
    (LeaderboardEntry & { position: number }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      if (range === "alltime") {
        // Top 10
        const { data: top } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, points, rank, completed_sessions")
          .order("points", { ascending: false })
          .limit(10);

        setTop10(top ?? []);

        // User's own rank
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("points", userEntry?.points ?? 0);

        const { data: myProfile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, points, rank, completed_sessions")
          .eq("id", user.id)
          .single();

        if (myProfile) {
          setUserEntry({ ...myProfile, position: (count ?? 0) + 1 });
        }
      } else {
        // Weekly/monthly — rank by sessions completed in range
        const from = new Date();
        if (range === "weekly") from.setDate(from.getDate() - 7);
        if (range === "monthly") from.setMonth(from.getMonth() - 1);

        const { data: sessions } = await supabase
          .from("sessions")
          .select("user_id, duration")
          .eq("completed", true)
          .gte("completed_at", from.toISOString());

        // Aggregate points per user
        const pointsMap: Record<string, number> = {};
        for (const s of sessions ?? []) {
          pointsMap[s.user_id] =
            (pointsMap[s.user_id] ?? 0) + Math.round(s.duration / 60);
        }

        // Get profiles for top users
        const topUserIds = Object.entries(pointsMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id]) => id);

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, points, rank, completed_sessions")
          .in("id", topUserIds);

        const ranked = topUserIds
          .map((id) => {
            const profile = profiles?.find((p) => p.id === id);
            return profile
              ? { ...profile, periodPoints: pointsMap[id] } // ← don't overwrite points
              : null;
          })
          .filter(Boolean) as LeaderboardEntry[];

        setTop10(ranked);

        // User's position
        const userPoints = pointsMap[user.id] ?? 0;

        if (userPoints === 0) {
          setUserEntry(null);
          setLoading(false);
          return;
        }

        const userPosition =
          Object.values(pointsMap).filter((p) => p > userPoints).length + 1;

        const { data: myProfile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, points, rank, completed_sessions")
          .eq("id", user.id)
          .single();

        if (myProfile) {
          setUserEntry({
            ...myProfile,
            points: userPoints,
            position: userPosition,
          });
        }
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, [range]);

  const medal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  };

  return (
    <div>
      {/* Range toggle */}
      <div className="flex gap-2 mb-6">
        {(["alltime", "weekly", "monthly"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-1 rounded text-sm font-medium ${
              range === r ? "bg-black text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {r === "alltime"
              ? "All Time"
              : r === "weekly"
                ? "This Week"
                : "This Month"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {top10.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  background:
                    entry.id === user.id
                      ? "color-mix(in srgb, var(--ring) 5%, transparent)"
                      : "var(--card)",
                  border:
                    entry.id === user.id
                      ? "1px solid var(--ring)"
                      : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl w-8">{medal(i)}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-400">
                        {entry.username?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {entry.username ?? "Anonymous"}
                    </p>
                    <RankCard
                      points={entry.points}
                      completedSessions={entry.completed_sessions}
                      size="tiny"
                    />{" "}
                  </div>
                </div>
                <span className="font-bold text-blue-600">
                  {entry.periodPoints ?? entry.points} pts
                </span>
              </div>
            ))}
          </div>

          {userEntry && !top10.find((e) => e.id === user.id) && (
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-gray-400 mb-2">Your rank</p>
              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-4">
                  <span className="text-xl w-8">#{userEntry.position}</span>
                  <div>
                    <p className="font-semibold">
                      {userEntry.username ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400">{userEntry.rank}</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">
                  {userEntry.points} pts
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
