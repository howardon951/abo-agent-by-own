import { PageSection } from "@/components/layout/page-section";
import { signUpAction } from "@/app/(auth)/server-actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <PageSection title="Signup" description="商家註冊後會進入 tenant setup。">
      <div className="panel card stack">
        {params.message ? (
          <div className="panel card" style={{ color: "var(--accent-strong)" }}>
            {params.message}
          </div>
        ) : null}
        <form action={signUpAction} className="stack">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" placeholder="Abo Coffee" />
            </div>
            <div className="field">
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" placeholder="abo-coffee" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" placeholder="owner@example.com" type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="至少 6 碼" />
          </div>
          <button className="button button-primary" type="submit">
            Create account
          </button>
        </form>
      </div>
    </PageSection>
  );
}
