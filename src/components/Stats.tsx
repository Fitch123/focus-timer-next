// Stats.tsx
interface StatsProps {
  sessions: number;
  streak: number;
  bestStreak: number;
}

export default function Stats({ sessions, streak, bestStreak }: StatsProps) {
  return (
    <div className="flex flex-col gap-2 text-center text-gray-600">
      <p>🔥 Sessions today: {sessions}</p>
      <p>💪 Streak: {streak} days</p>
      <p>🏆 Best streak: {bestStreak} days</p>
    </div>
  );
}
