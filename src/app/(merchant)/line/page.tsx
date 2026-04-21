import { PageSection } from "@/components/layout/page-section";
import { LineIntegrationForm } from "@/components/merchant/line-integration-form";
import { MerchantPageHero } from "@/components/merchant/merchant-page-hero";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLineChannelConnection } from "@/server/domain/channel/connect-line-channel";

export default async function LinePage() {
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

  const connection = await getLineChannelConnection(user.tenantId);

  return (
    <PageSection title="LINE Channel" description="設定 channel secret、token 與 webhook。">
      <MerchantPageHero
        eyebrow="Launch"
        title="Connect your bot to a real LINE OA"
        description="這頁負責把商家的 AI 助手接到真實訊息入口。沒有 LINE channel，後面的知識庫和回覆邏輯都不會進入線上流量。"
        businessQuestion="商家最需要先知道：這個 bot 現在有沒有真的接到 LINE OA？"
        actions={[
          { href: "/knowledge", label: "Next: Knowledge Base", variant: "secondary" }
        ]}
        stats={[
          {
            label: "Channel Status",
            value: connection.channel?.status ?? "disconnected",
            hint: connection.channel ? "已建立主 channel 設定" : "尚未完成綁定"
          },
          {
            label: "Webhook",
            value: connection.channel?.webhookVerifiedAt ? "verified" : "pending",
            hint: connection.channel?.webhookVerifiedAt
              ? "LINE 已記錄驗證時間"
              : "仍待 LINE 端驗證"
          },
          {
            label: "Endpoint",
            value: connection.channel?.webhookUrl?.includes("localhost") ? "local" : "public",
            hint: connection.channel?.webhookUrl ?? "尚未生成 webhook URL"
          }
        ]}
      />
      <LineIntegrationForm />
    </PageSection>
  );
}
