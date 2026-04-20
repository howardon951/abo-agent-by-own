import { requirePlatformAdminPage } from "@/lib/auth/guards";

export default async function PlatformLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePlatformAdminPage();

  return children;
}
