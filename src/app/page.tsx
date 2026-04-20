import Link from "next/link";
import { PageSection } from "@/components/layout/page-section";
import { StatCard } from "@/components/ui/stat-card";

export default function HomePage() {
  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection
        title="Product"
        description="讓商家用表單設定品牌 AI，接上 LINE OA，自動回答 FAQ，遇到敏感問題轉真人。"
      >
        <div className="panel card stack" style={{ gap: 18 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>Abo Agent</h1>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: 720 }}>
            為中小商家打造的 LINE AI 助手平台。重點不是做萬能 agent，而是讓 FAQ、
            門市資訊、售前問答與轉真人流程快速上線。
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/dashboard" className="button button-primary">
              進入商家後台
            </Link>
            <Link href="/platform" className="button button-secondary">
              查看平台後台
            </Link>
          </div>
        </div>
      </PageSection>

      <div className="grid-3">
        <StatCard label="Delivery Scope" value="MVP-1" hint="1 tenant / 1 agent / 1 LINE OA" />
        <StatCard label="Knowledge" value="RAG" hint="FAQ + PDF + single-page URL" />
        <StatCard label="Handoff" value="Manual" hint="轉真人後 bot 完全停用" />
      </div>
    </div>
  );
}
