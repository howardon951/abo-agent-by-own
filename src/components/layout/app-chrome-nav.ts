import type { SessionUser } from "@/lib/auth/session";

export type AppChromeNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
};

export type AppChromeNavSection = {
  title: string;
  items: AppChromeNavItem[];
};

export function buildAppChromeNavSections(user: SessionUser | null): AppChromeNavSection[] {
  if (!user) {
    return [
      {
        title: "Explore",
        items: [
          { href: "/", label: "Home" },
          { href: "/pricing", label: "Pricing" },
          { href: "/contact", label: "Contact" }
        ]
      },
      {
        title: "Account",
        items: [
          { href: "/login", label: "Login" },
          { href: "/signup", label: "Signup" }
        ]
      }
    ];
  }

  if (!user.tenantId) {
    return [
      {
        title: "Get Started",
        items: [{ href: "/setup", label: "Workspace Setup" }]
      },
      {
        title: "Reference",
        items: [{ href: "/pricing", label: "Pricing" }]
      }
    ];
  }

  const sections: AppChromeNavSection[] = [
    {
      title: "Overview",
      items: [{ href: "/dashboard", label: "Overview" }]
    },
    {
      title: "Launch",
      items: [
        { href: "/line", label: "LINE Channel" },
        { href: "/knowledge", label: "Knowledge Base" }
      ]
    },
    {
      title: "Behavior",
      items: [
        { href: "/agent", label: "Agent Profile" },
        { href: "/scenarios", label: "Response Scenarios" }
      ]
    },
    {
      title: "Inbox",
      items: [{ href: "/conversations", label: "Conversations" }]
    },
    {
      title: "Tools",
      items: [{ href: "/playground", label: "Test Playground" }]
    },
    {
      title: "Admin",
      items: [{ href: "/settings", label: "Settings" }]
    }
  ];

  if (user.role === "platform_admin") {
    sections.push({
      title: "Platform",
      items: [{ href: "/platform", label: "Platform Console" }]
    });
  }

  return sections;
}

export function buildAppChromeNav(user: SessionUser | null): AppChromeNavItem[] {
  return buildAppChromeNavSections(user).flatMap((section) => section.items);
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
