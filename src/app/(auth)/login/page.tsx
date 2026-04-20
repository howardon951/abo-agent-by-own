import Link from "next/link";
import { PageSection } from "@/components/layout/page-section";
import { signInAction } from "@/app/(auth)/server-actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <PageSection title="Login" description="MVP 先保留 auth 入口頁，之後接 Supabase Auth。">
      <div className="panel card stack">
        {params.message ? (
          <div className="panel card" style={{ color: "var(--accent-strong)" }}>
            {params.message}
          </div>
        ) : null}
        <form action={signInAction} className="stack">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="owner@example.com" type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••••" />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="button button-primary" type="submit">
              Sign in
            </button>
            <Link href="/signup" className="button button-secondary">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </PageSection>
  );
}
