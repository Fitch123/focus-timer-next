export const ranks = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 200 },
  { name: "Gold", min: 500 },
  { name: "Platinum", min: 1000 },
  { name: "Diamond", min: 2000 },
  { name: "Master", min: 4000 },
  { name: "Grandmaster", min: 7000 },
  { name: "Pro", min: 12000 },
];

const MIN_SESSIONS_FOR_RANK = 5;

export function getRankProgress(points: number, completedSessions: number) {
  // 🔹 If not enough sessions → Unranked
  if (completedSessions < MIN_SESSIONS_FOR_RANK) {
    return {
      currentRank: "Unranked",
      progress: 0,
      needed: MIN_SESSIONS_FOR_RANK - completedSessions,
      isUnranked: true,
    };
  }

  const current = [...ranks].reverse().find((r) => points >= r.min)!;
  const next = ranks.find((r) => r.min > points);

  if (!next) {
    return {
      currentRank: current.name,
      progress: 100,
      needed: 0,
      isUnranked: false,
    };
  }

  const progress = ((points - current.min) / (next.min - current.min)) * 100;

  return {
    currentRank: current.name,
    progress,
    needed: next.min - points,
    isUnranked: false,
  };
}
