export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="panel card stack" style={{ gap: 10 }}>
      <span style={{ color: "var(--muted)", fontSize: 14 }}>{label}</span>
      <strong style={{ fontSize: 28 }}>{value}</strong>
      {hint ? <span style={{ color: "var(--muted)", fontSize: 14 }}>{hint}</span> : null}
    </div>
  );
}
