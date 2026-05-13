interface TimerRingProps {
  progress: number;
  size?: number;
  stroke?: number;
  isRunning?: boolean;
}

export default function TimerRing({
  progress,
  size = 300,
  stroke = 6,
  isRunning = false,
}: TimerRingProps) {
  const radius = (size - stroke - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (progress - 1);

  const angle = (1 - progress) * 2 * Math.PI - Math.PI / 2;
  const dotCx = size / 2 + radius * Math.cos(angle);
  const dotCy = size / 2 + radius * Math.sin(angle);

  console.log({ progress, offset, circumference, radius });
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        animation: isRunning ? "breathe 4s ease-in-out infinite" : "none",
      }}
    >
      <svg width={size} height={size}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--muted)"
          strokeWidth={stroke}
          fill="transparent"
        />

        {/* Rest of the ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--ring)"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: isRunning
              ? "stroke-dashoffset 1s linear"
              : "stroke-dashoffset 0.4s ease",
          }}
        />

        {/* Dot */}
        {progress > 0 && progress < 1 && (
          <circle
            cx={dotCx}
            cy={dotCy}
            r={stroke + 1}
            fill="var(--ring)"
            style={{
              transition: isRunning
                ? "cx 1s linear, cy 1s linear"
                : "cx 0.4s ease, cy 0.4s ease",
            }}
          />
        )}
      </svg>
    </div>
  );
}
