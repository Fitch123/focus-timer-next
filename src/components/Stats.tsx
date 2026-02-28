// Stats.tsx
interface StatsProps {
  sessions: number;
}

export default function Stats({ sessions }: StatsProps) {
  return (
    <div className="flex flex-col gap-2 text-center text-gray-600">
      <p>🔥 Sessions today: {sessions}</p>
    </div>
  );
}
