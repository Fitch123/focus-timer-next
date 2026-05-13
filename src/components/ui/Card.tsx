export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-5 rounded-2xl transition-all ${className}`}
      style={{
        background: "var(--card)",
        boxShadow: "var(--shadow)",
        border: "3px solid rgba(0,0,0,0.04)",
        backdropFilter: "blur(10px)",
      }}
    >
      {children}
    </div>
  );
}
