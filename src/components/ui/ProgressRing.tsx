interface ProgressRingProps {
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 100,
  stroke = 6,
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size}>
        {/* background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--muted)"
          strokeWidth={stroke}
          fill="transparent"
        />

        {/* progress */}
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
            transition: "stroke-dashoffset 0.5s ease",
          }}
        />
      </svg>

      {/* CENTER CONTENT */}
      <div className="absolute flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
