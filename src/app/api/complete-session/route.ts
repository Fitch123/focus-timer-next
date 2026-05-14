import { createClient } from "@/utils/supabase/server";
import { calculateSessionXP } from "@/lib/xp";
import { getRankProgress } from "@/lib/ranks";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { duration, rankMode } = await req.json();
    const completedMinutes = Math.round(duration / 60);

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("points, completed_sessions, current_streak")
      .eq("id", user.id)
      .single();

    // Calculate XP
    const { xp } = calculateSessionXP({
      plannedMinutes: completedMinutes,
      completedMinutes: completedMinutes,
      currentStreak: profile?.current_streak ?? 0,
      rankMode: rankMode ?? false,
    });

    const newPoints = Math.max(0, (profile?.points ?? 0) + xp);
    const newSessions = (profile?.completed_sessions ?? 0) + 1;

    // Get new rank
    const { currentRank } = getRankProgress(newPoints, newSessions);

    // Insert session
    await supabase.from("sessions").insert({
      user_id: user.id,
      duration,
      completed: true,
      completed_at: new Date().toISOString(),
      xp_earned: xp,
    });

    // Update profile
    await supabase
      .from("profiles")
      .update({
        points: newPoints,
        completed_sessions: newSessions,
        rank: currentRank,
      })
      .eq("id", user.id);

    return Response.json({ success: true, xp, newPoints, rank: currentRank });
  } catch (err) {
    console.error("❌ complete-session error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
