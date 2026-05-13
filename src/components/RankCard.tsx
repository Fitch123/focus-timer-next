"use client";

import { getRankProgress, ranks } from "@/lib/ranks";
import Card from "./ui/Card";

type RankCardSize = "big" | "small" | "tiny";

interface RankCardProps {
  points: number;
  completedSessions: number;
  size?: RankCardSize;
}

const rankEmojis: Record<string, string> = {
  Unranked: "⬜",
  "Foundation Phase": "🌱",
  Beginner: "🟢",
  Practitioner: "📘",
  Performer: "⚡",
  Disciplined: "🛡️",
  Focused: "🎯",
  Elite: "💎",
  "Flow State": "🌊",
  Master: "👑",
};

export default function RankCard({
  points,
  completedSessions,
  size = "big",
}: RankCardProps) {
  const { currentRank, progress, needed, isUnranked } = getRankProgress(
    points,
    completedSessions,
  );
  const emoji = rankEmojis[currentRank] ?? "🏅";

  const currentIndex = ranks.findIndex((r) => r.name === currentRank);
  const nextRank = ranks[currentIndex + 1];

  // ── TINY ──
  if (size === "tiny") {
    return (
      <span className="text-xs text-gray-400">
        {emoji} {currentRank}
      </span>
    );
  }

  // ── SMALL ──
  if (size === "small") {
    return (
      <Card className="flex flex-col gap-4">
        {/* TITLE */}
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text)" }}
        >
          Rank
        </p>

        {/* RANK ROW */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "rgba(196,146,74,0.12)" }}
          >
            {emoji}
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              {currentRank}
            </p>
            <p className="text-xs" style={{ color: "var(--text)" }}>
              {points.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div>
          <div
            className="flex justify-between text-xs mb-1.5"
            style={{ color: "var(--text)" }}
          >
            <span>{currentRank}</span>
            <span>{nextRank ? nextRank.name : "Max Rank"}</span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(0,0,0,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: "var(--ring)",
              }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text)" }}>
            {isUnranked
              ? `${needed} session${needed !== 1 ? "s" : ""} to unlock Foundation Phase`
              : nextRank
                ? `${needed.toLocaleString()} XP until ${nextRank.name}`
                : "👑 Max Rank Achieved"}
          </p>
        </div>
      </Card>
    );
  }

  // ── BIG ──
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{emoji}</span>
        <div>
          <p className="text-xl font-bold">{currentRank}</p>
          <p className="text-sm text-gray-400">{points.toLocaleString()} XP</p>
        </div>
      </div>

      {isUnranked ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Unranked</span>
            <span>{completedSessions} / 4 sessions</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "var(--ring)" }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {needed} more session{needed !== 1 ? "s" : ""} to unlock Foundation
            Phase
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{currentRank}</span>
            <span>{nextRank ? nextRank.name : "Max Rank"}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "var(--ring)" }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {nextRank
              ? `${needed.toLocaleString()} XP until ${nextRank.name}`
              : "👑 Max Rank Achieved"}
          </p>
        </div>
      )}
    </div>
  );
}
