import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/(auth)/server-actions";
import {
  buildAppChromeNavSections,
  getAppChromeRoleLabel
} from "@/components/layout/app-chrome-nav";
import { AppChromeSidebar } from "@/components/layout/app-chrome-sidebar";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const navSections = buildAppChromeNavSections(user);

  return (
    <div className="app-shell">
      <AppChromeSidebar user={user} sections={navSections} />
      <div className="app-main">
        <header className="app-topbar panel">
          <div className="stack" style={{ gap: 4 }}>
            <span className="app-sidebar-label">Merchant Operations Console</span>
            <strong style={{ fontSize: 20 }}>
              {user?.tenantId ? "Operate your LINE assistant" : "Set up your workspace"}
            </strong>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/" className="button button-secondary">
              Public Home
            </Link>
            {user ? (
              <>
                <div className="stack" style={{ gap: 2, textAlign: "right" }}>
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
            ) : (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/login" className="button button-secondary">
                  Login
                </Link>
                <Link href="/signup" className="button button-primary">
                  Signup
                </Link>
              </div>
            )}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
