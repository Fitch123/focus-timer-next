"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/navigation/Navbar";
import Analytics from "@/components/Analytics";
import Leaderboard from "@/components/Leaderboard";
import type { User } from "@supabase/supabase-js";
import RankCard from "@/components/RankCard";

export default function DashboardClient({
  user,
  profile,
}: {
  user: User;
  profile: any;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"analytics" | "leaderboard">("analytics");

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <Navbar user={user} onLogout={handleLogout} onOpenAuth={() => {}} />

      <div className="max-w-3xl mx-auto p-8">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: "var(--text)" }}
        >
          Dashboard
        </h1>

        <div className="mb-8">
          <RankCard
            points={profile?.points ?? 0}
            completedSessions={profile?.completed_sessions ?? 0}
            size="big"
          />
        </div>

        {/* Tabs */}
        <div
          className="flex gap-2 border-b mb-8"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <button
            onClick={() => setTab("analytics")}
            className="px-4 py-2 text-sm font-medium border-b-2 transition"
            style={{
              borderColor: tab === "analytics" ? "var(--text)" : "transparent",
              color: tab === "analytics" ? "var(--text)" : "var(--text)",
            }}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab("leaderboard")}
            className="px-4 py-2 text-sm font-medium border-b-2 transition"
            style={{
              borderColor:
                tab === "leaderboard" ? "var(--text)" : "transparent",
              color: tab === "leaderboard" ? "var(--text)" : "var(--text)",
            }}
          >
            Leaderboard
          </button>
        </div>

        {/* Tab Content */}
        {tab === "analytics" && <Analytics />}
        {tab === "leaderboard" && <Leaderboard user={user} />}
      </div>
    </div>
  );
}
