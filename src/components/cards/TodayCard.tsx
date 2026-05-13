import Card from "@/components/ui/Card";
import ProgressRing from "@/components/ui/ProgressRing";

export default function TodayCard({
  goalProgress,
  DAILY_GOAL,
  goalCompleted,
}: any) {
  const progress = goalProgress / DAILY_GOAL;

  return (
    <Card className="flex flex-col gap-5">
      {/* TITLE */}
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text)" }}
      >
        Today's Progress
      </p>

      {/* RING */}
      <div className="flex flex-col items-center gap-2">
        <ProgressRing progress={progress} size={120}>
          <span
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            {goalProgress}/{DAILY_GOAL}
          </span>
        </ProgressRing>
        <p className="text-xs" style={{ color: "var(--text)" }}>
          {goalCompleted ? "Goal reached 🎉" : "Sessions completed"}
        </p>
      </div>
    </Card>
  );
}
