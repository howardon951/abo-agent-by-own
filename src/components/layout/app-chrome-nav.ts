import type { SessionUser } from "@/lib/auth/session";

export type AppChromeNavItem = {
  href: string;
  label: string;
};

export function buildAppChromeNav(user: SessionUser | null): AppChromeNavItem[] {
  const merchantNav = user?.tenantId
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/agent", label: "Agent" },
        { href: "/scenarios", label: "Scenarios" },
        { href: "/knowledge", label: "Knowledge" },
        { href: "/conversations", label: "Conversations" },
        { href: "/line", label: "LINE" },
        { href: "/playground", label: "Playground" }
      ]
    : user
      ? [{ href: "/setup", label: "Setup" }]
      : [];

  return [
    { href: "/", label: "Home" },
    ...merchantNav,
    ...(user?.role === "platform_admin" ? [{ href: "/platform", label: "Platform" }] : []),
    { href: "/pricing", label: "Pricing" },
    ...(!user
      ? [
          { href: "/login", label: "Login" },
          { href: "/signup", label: "Signup" }
        ]
      : [])
  ];
}

export function getAppChromeRoleLabel(user: SessionUser) {
  if (user.role === "platform_admin") {
    return "platform admin";
  }

  if (user.tenantId) {
    return "merchant owner";
  }

  return "setup pending";
}
