import Link from "next/link";

const navGroups = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Merchant" },
  { href: "/platform", label: "Platform" },
  { href: "/playground", label: "Playground" },
  { href: "/pricing", label: "Pricing" }
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px 0 40px"
      }}
    >
      <header className="page-shell" style={{ marginBottom: 24 }}>
        <div
          className="panel"
          style={{
            padding: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          <div className="stack" style={{ gap: 4 }}>
            <Link href="/" style={{ fontSize: 22, fontWeight: 700 }}>
              Abo Agent
            </Link>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              LINE AI assistant for merchant operations
            </span>
          </div>
          <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {navGroups.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="button button-secondary"
                style={{ padding: "10px 14px" }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
