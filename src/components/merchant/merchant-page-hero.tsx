import Link from "next/link";

type HeroStat = {
  label: string;
  value: string;
  hint: string;
};

type HeroAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export function MerchantPageHero({
  eyebrow,
  title,
  description,
  businessQuestion,
  actions = [],
  stats = []
}: {
  eyebrow: string;
  title: string;
  description: string;
  businessQuestion: string;
  actions?: HeroAction[];
  stats?: HeroStat[];
}) {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel card stack">
        <span className="app-sidebar-label">{eyebrow}</span>
        <strong style={{ fontSize: 28 }}>{title}</strong>
        <p style={{ margin: 0, color: "var(--muted)" }}>{description}</p>
        <div className="panel card" style={{ background: "rgba(255,255,255,0.45)" }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="app-sidebar-label">This Page Solves</span>
            <strong>{businessQuestion}</strong>
          </div>
        </div>
        {actions.length > 0 ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={action.variant === "secondary" ? "button button-secondary" : "button button-primary"}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {stats.length > 0 ? (
        <div className="grid-3">
          {stats.map((stat) => (
            <div key={stat.label} className="panel card stack" style={{ gap: 8 }}>
              <span className="app-sidebar-label">{stat.label}</span>
              <strong style={{ fontSize: 24 }}>{stat.value}</strong>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>{stat.hint}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
