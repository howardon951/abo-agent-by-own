import { PageSection } from "@/components/layout/page-section";
import { AgentSettingsForm } from "@/components/merchant/agent-settings-form";
import { MerchantPageHero } from "@/components/merchant/merchant-page-hero";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getCurrentAgent } from "@/server/domain/agent/get-current-agent";

export default async function AgentPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "tenant_owner" && !user.tenantId) {
    redirect("/setup");
  }

  if (!user.tenantId) {
    redirect("/dashboard");
  }

  const currentAgent = await getCurrentAgent(user.tenantId);

  return (
    <PageSection title="Agent Profile" description="以表單設定品牌規則與 fallback。">
      <MerchantPageHero
        eyebrow="Behavior"
        title="Define how the brand should sound and fail safely"
        description="這頁負責設定 bot 的品牌人格、禁答範圍與 fallback 原則。它不決定何時觸發哪種回覆，而是決定 bot 回起來像不像這個商家。"
        businessQuestion="商家最需要先知道：這個 bot 回話的口吻、邊界與保守策略是不是符合品牌？"
        actions={[
          { href: "/scenarios", label: "Next: Response Scenarios", variant: "secondary" }
        ]}
        stats={[
          {
            label: "Active Agent",
            value: currentAgent.agent.name,
            hint: `目前品牌名稱：${currentAgent.agent.brandName}`
          },
          {
            label: "Forbidden Topics",
            value: String(currentAgent.agent.forbiddenTopics.length),
            hint: "目前已設定的禁答主題數"
          },
          {
            label: "Fallback Policy",
            value: currentAgent.agent.fallbackPolicy ? "configured" : "empty",
            hint: currentAgent.agent.fallbackPolicy ?? "尚未設定保守回覆策略"
          }
        ]}
      />
      <AgentSettingsForm />
    </PageSection>
  );
}
