import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/(auth)/server-actions";
import { buildAppChromeNav, getAppChromeRoleLabel } from "@/components/layout/app-chrome-nav";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const navGroups = buildAppChromeNav(user);

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
          <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {navGroups.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="button button-secondary"
                style={{ padding: "10px 14px" }}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    marginLeft: 4
                  }}
                >
                  <span style={{ color: "var(--muted)", fontSize: 14 }}>{user.email}</span>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    {getAppChromeRoleLabel(user)}
                  </span>
                </div>
                <form action={signOutAction}>
                  <button className="button button-secondary" type="submit">
                    Logout
                  </button>
                </form>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
