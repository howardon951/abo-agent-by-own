import { PageSection } from "@/components/layout/page-section";
import { ScenariosManager } from "@/components/merchant/scenarios-manager";
import { MerchantPageHero } from "@/components/merchant/merchant-page-hero";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { listScenarios } from "@/server/domain/scenario/list-scenarios";

export default async function ScenariosPage() {
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

  const scenarioData = await listScenarios(user.tenantId);
  const enabledCount = scenarioData.filter((scenario) => scenario.isEnabled).length;
  const keywordCount = scenarioData.reduce(
    (total, scenario) => total + scenario.routingKeywords.length,
    0
  );

  return (
    <PageSection title="Response Scenarios" description="MVP 採規則式路由。">
      <MerchantPageHero
        eyebrow="Behavior"
        title="Tell the bot which questions belong to which playbook"
        description="這頁負責把訊息分流成一般 FAQ、售前、售後或門市資訊等場景。它回答的是路由問題，不是語氣問題。"
        businessQuestion="商家最需要先知道：使用者丟進來的訊息，bot 會被分到哪一套回覆規則？"
        actions={[
          { href: "/playground", label: "Test Routing" },
          { href: "/conversations", label: "See Real Conversations", variant: "secondary" }
        ]}
        stats={[
          {
            label: "Scenarios",
            value: String(scenarioData.length),
            hint: "目前 active agent 底下的情境數"
          },
          {
            label: "Enabled",
            value: String(enabledCount),
            hint: "目前啟用中的情境數"
          },
          {
            label: "Routing Keywords",
            value: String(keywordCount),
            hint: "所有情境加總的 keyword 數"
          }
        ]}
      />
      <ScenariosManager />
    </PageSection>
  );
}
