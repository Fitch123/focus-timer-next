import Card from "@/components/ui/Card";

function StatRow({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: string;
  label: string;
  value: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <span className="text-sm" style={{ color: "var(--text)" }}>
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

export default function StatsCard({
  sessions,
  focusMinutes,
  streak,
}: {
  sessions: number;
  focusMinutes: number;
  streak: number;
}) {
  const hours = Math.floor(focusMinutes / 60);
  const minutes = focusMinutes % 60;
  const focusLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const stats = [
    {
      icon: "🕐",
      label: "Focus Time",
      value: focusLabel,
      iconBg: "rgba(196,146,74,0.12)",
    },
    {
      icon: "🔥",
      label: "Day Streak",
      value: `${streak}`,
      iconBg: "rgba(239,68,68,0.1)",
    },
    {
      icon: "📅",
      label: "Sessions Today",
      value: `${sessions}`,
      iconBg: "rgba(196,146,74,0.12)",
    },
  ];

  return (
    <Card>
      {/* TITLE */}
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-1"
        style={{ color: "var(--text)" }}
      >
        Stats
      </p>

      {/* ROWS */}
      <div className="divide-y divide-black/6">
        {stats.map((s) => (
          <StatRow key={s.label} {...s} />
        ))}
      </div>
    </Card>
  );
}
