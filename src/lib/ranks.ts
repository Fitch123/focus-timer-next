export const ranks = [
  { name: "Beginner", min: 0 },
  { name: "Practitioner", min: 300 },
  { name: "Performer", min: 800 },
  { name: "Disciplined", min: 1500 },
  { name: "Focused", min: 3000 },
  { name: "Elite", min: 6000 },
  { name: "Flow State", min: 10000 },
  { name: "Master", min: 15000 },
];

const MIN_SESSIONS_FOR_RANK = 4;

export function getRankProgress(points: number, completedSessions: number) {
  const safePoints = Math.max(points, 0);

  // 🔹 Not enough sessions → Foundation Phase
  if (completedSessions < MIN_SESSIONS_FOR_RANK) {
    return {
      currentRank: "Unranked",
      progress: (completedSessions / MIN_SESSIONS_FOR_RANK) * 100,
      needed: MIN_SESSIONS_FOR_RANK - completedSessions,
      isUnranked: true,
    };
  }

  // 🔹 Find current rank
  let currentIndex = 0;

  for (let i = 0; i < ranks.length; i++) {
    if (safePoints >= ranks[i].min) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const current = ranks[currentIndex];
  const next = ranks[currentIndex + 1];

  // 🔹 If max rank reached
  if (!next) {
    return {
      currentRank: current.name,
      progress: 100,
      needed: 0,
      isUnranked: false,
    };
  }

  // 🔹 Calculate progress within current tier
  const range = next.min - current.min;
  const progress = ((safePoints - current.min) / range) * 100;

  return {
    currentRank: current.name,
    progress: Math.min(Math.max(progress, 0), 100),
    needed: next.min - safePoints,
    isUnranked: false,
  };
}
