# Next.js 專案結構規劃

## 1. 原則

- 平台後台與商家後台共用同一個 Next.js 專案
- 用 route groups 隔離角色入口
- 業務邏輯集中在 `src/server`，不要把核心流程散在 route handlers
- LINE webhook 與 worker 使用同一份 domain/service code

## 2. 建議目錄

```text
src/
  app/
    (marketing)/
      page.tsx
      pricing/page.tsx
      contact/page.tsx
    (auth)/
      login/page.tsx
      signup/page.tsx
      invite/accept/page.tsx
    (merchant)/
      dashboard/page.tsx
      agent/page.tsx
      scenarios/page.tsx
      knowledge/page.tsx
      knowledge/new/page.tsx
      line/page.tsx
      conversations/page.tsx
      conversations/[conversationId]/page.tsx
      playground/page.tsx
      settings/page.tsx
    (platform)/
      platform/page.tsx
      platform/tenants/page.tsx
      platform/tenants/[tenantId]/page.tsx
      platform/logs/page.tsx
      platform/usage/page.tsx
    api/
      tenant/setup/route.ts
      agent/route.ts
      scenarios/route.ts
      scenarios/[scenarioId]/route.ts
      knowledge/documents/route.ts
      knowledge/documents/[documentId]/route.ts
      line/connect/route.ts
      conversations/route.ts
      conversations/[conversationId]/route.ts
      conversations/[conversationId]/resume-bot/route.ts
      playground/run/route.ts
      platform/tenants/route.ts
      platform/tenants/[tenantId]/route.ts
      platform/logs/errors/route.ts
      platform/usage/route.ts
      webhooks/line/route.ts
    layout.tsx
    globals.css

  components/
    ui/
    layout/
    forms/
    tables/
    charts/
    playground/
    conversations/

  features/
    auth/
      components/
      hooks/
    tenant/
      components/
      schemas.ts
    agent/
      components/
      schemas.ts
    scenario/
      components/
      schemas.ts
    knowledge/
      components/
      schemas.ts
    line/
      components/
      schemas.ts
    conversation/
      components/
    platform/
      components/

  lib/
    env.ts
    supabase/
      browser.ts
      server.ts
      admin.ts
    auth/
      guards.ts
      session.ts
    utils/
      dates.ts
      text.ts
      crypto.ts
      logger.ts

  server/
    db/
      queries/
      mutations/
    domain/
      tenant/
      agent/
      scenario/
      knowledge/
      channel/
      conversation/
      runtime/
      billing/
    services/
      line/
        line-client.ts
        line-signature.ts
      llm/
        llm-provider.ts
        openai-provider.ts
      retrieval/
        embedder.ts
        chunker.ts
        retriever.ts
      jobs/
        enqueue.ts
        claim-job.ts
      documents/
        parse-pdf.ts
        fetch-webpage.ts
        normalize-text.ts
    policies/
      tenant-access.ts
      platform-access.ts
    dto/
    validators/

  worker/
    index.ts
    process-message-job.ts
    process-document-job.ts
    retry-policy.ts
```

## 3. 模組邊界

### `src/app`

- 頁面與 API 入口
- 不直接承擔重業務邏輯

### `src/features`

- 頁面級 UI 與表單邏輯
- 可維持畫面與欄位設計集中

### `src/server/domain`

- 核心商業規則
- 例如 handoff 判斷、scenario routing、prompt assembly

### `src/server/services`

- 第三方整合與技術細節
- 例如 LINE、LLM、embedding、PDF parsing

### `src/worker`

- 處理非同步 job
- 與 API 分離部署，但共用 `src/server`

## 4. 最重要的 code ownership 原則

- Route handler 只做：
  - auth
  - validate
  - call service
  - return response

- Runtime 流程要集中在單一 orchestrator，例如：
  - `src/server/domain/runtime/process-incoming-message.ts`

- Prompt 組裝要集中，不要散在 page、route、worker 各處

## 5. MVP 首批要先建立的檔案

- `src/app/(merchant)/dashboard/page.tsx`
- `src/app/(merchant)/agent/page.tsx`
- `src/app/api/webhooks/line/route.ts`
- `src/server/domain/runtime/process-incoming-message.ts`
- `src/server/services/line/line-client.ts`
- `src/server/services/llm/llm-provider.ts`
- `src/server/services/retrieval/retriever.ts`
- `src/worker/process-message-job.ts`

