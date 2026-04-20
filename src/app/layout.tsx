import type { Metadata } from "next";
import { AppChrome } from "@/components/layout/app-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abo Agent",
  description: "LINE AI agent SaaS for merchants"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
