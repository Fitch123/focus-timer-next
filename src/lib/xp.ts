type CalculateXPParams = {
  plannedMinutes: number;
  completedMinutes: number;
  currentStreak: number;
  strictMode?: boolean;
};

export function calculateSessionXP({
  plannedMinutes,
  completedMinutes,
  currentStreak,
  strictMode = false,
}: CalculateXPParams) {
  // Safety guards
  const safePlanned = Math.max(plannedMinutes, 1);
  const safeCompleted = Math.max(Math.min(completedMinutes, safePlanned), 0);

  const completionRate = safeCompleted / safePlanned;

  // ❌ Early quit penalty (<70%)
  if (completionRate < 0.7) {
    return {
      xp: -5,
      breakdown: {
        base: 0,
        completionMultiplier: 0,
        longSessionBonus: 0,
        streakBonus: 0,
        strictBonus: 0,
        penalty: -5,
      },
    };
  }

  // 🔹 Base XP
  const baseXP = safeCompleted * 0.8;

  // 🔹 Completion Multiplier
  const multiplier = completionRate === 1 ? 1 : 0.6;
  let xp = baseXP * multiplier;

  // 🔹 Long Session Bonus (only if 100% completed)
  let longSessionBonus = 0;

  if (completionRate === 1) {
    if (safePlanned >= 90) {
      longSessionBonus = 10;
    } else if (safePlanned >= 50) {
      longSessionBonus = 5;
    }
  }

  xp += longSessionBonus;

  // 🔥 Streak Bonus (capped at +20)
  const streakBonus = Math.min(currentStreak * 2, 20);
  xp += streakBonus;

  // 🔥 Strict Mode Bonus — 50% extra XP
  const strictBonus = strictMode ? Math.round(xp * 0.5) : 0;
  xp += strictBonus;

  // 🔹 Final rounding
  const finalXP = Math.round(xp);

  return {
    xp: finalXP,
    breakdown: {
      base: Math.round(baseXP),
      completionMultiplier: multiplier,
      longSessionBonus,
      streakBonus,
      strictBonus,
      penalty: 0,
    },
  };
}
