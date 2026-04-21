"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import type { AppChromeNavSection } from "@/components/layout/app-chrome-nav";

export function AppChromeSidebar({
  user,
  sections
}: {
  user: SessionUser | null;
  sections: AppChromeNavSection[];
}) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar panel">
      <div className="app-sidebar-brand">
        <Link href={user?.tenantId ? "/dashboard" : "/"} className="app-brand-link">
          Abo Agent
        </Link>
        <p className="app-sidebar-copy">
          把 LINE AI 助手拆成清楚的上線流程、回覆邏輯與營運面板。
        </p>
      </div>

      <div className="app-sidebar-status panel card stack" style={{ gap: 8 }}>
        <span className="app-sidebar-label">Current Workspace</span>
        <strong>{user?.tenantId ?? "No workspace yet"}</strong>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {user ? user.email : "Sign in to configure your merchant workspace"}
        </span>
      </div>

      <nav className="app-sidebar-nav">
        {sections.map((section) => (
          <section key={section.title} className="app-sidebar-section">
            <span className="app-sidebar-section-title">{section.title}</span>
            <div className="app-sidebar-links">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "app-sidebar-link is-active" : "app-sidebar-link"}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
