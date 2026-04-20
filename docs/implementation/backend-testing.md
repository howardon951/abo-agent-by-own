# 後端測試架構設計

## 1. 目的

本文件定義此專案的後端測試策略，目標是讓核心商業邏輯可以在不依賴真實 Supabase、LINE、LLM 的情況下穩定驗證。

目前優先測試的後端能力：

- tenant onboarding
- schema smoke checks
- auth 後的租戶解析
- tenant-scoped API auth boundary
- agent / scenario repository-backed domain logic
- message runtime orchestration
- webhook ingestion

## 2. 測試分層

### Layer 1: Domain Unit Tests

範圍：

- 純商業邏輯
- domain service 的成功與失敗分支
- bootstrap / compensation 行為

特性：

- 不連外
- 不打真 DB
- 使用 fake repository 或 fake service
- 執行速度快

本專案目前已先完成一批這一層，因為它最能穩定保護一人開發時最容易壞掉的流程邏輯。

適用案例：

- `setupTenant()`
- `resolveSessionUser()`
- scenario routing
- handoff rule 判斷
- prompt assembly

### Layer 1.5: Schema Smoke Tests

範圍：

- 用文字比對驗證 `schema.sql` 的關鍵結構仍存在
- 適合先保護 enum、composite FK、job queue 欄位、RLS policy 取向

特性：

- 不需要真實 Supabase instance
- 無法取代 migration/integration test
- 但很適合在 schema 還快速變動時擋掉低級回歸

### Layer 2: Integration Tests

範圍：

- 與 Supabase 的真實資料寫入
- route handler 與 DB 的串接
- RLS / membership / onboarding 的實際資料效果

特性：

- 需要測試用 Supabase project 或 local stack
- 資料初始化與清理成本較高
- 用於驗證 schema / query / transaction 是否真的可運作

適用案例：

- `/api/tenant/setup`
- `getSessionUser()`
- tenant onboarding 寫入 `tenants / tenant_members / agents / knowledge_bases`

### Layer 3: Workflow / Smoke Tests

範圍：

- login -> setup -> dashboard
- webhook -> message job -> runtime

特性：

- 驗證完整主流程
- 數量要少，專注於主幹路徑

適用案例：

- 新註冊商家 onboarding
- LINE 收訊到 bot 回覆

## 3. 架構原則

### 3.1 Domain 要透過 Port/Repository 抽象依賴

像 `setupTenant()` 這類核心流程，不應直接把 Supabase query 寫死在邏輯裡。

正確做法：

- `setupTenant(input, repository)`
- production 用 Supabase repository
- test 用 fake repository

這樣測試能直接控制：

- 既有 membership
- create tenant 成功/失敗
- bootstrap 某一步出錯
- compensation 是否執行

### 3.2 Route Handler 只測邊界，不承擔大邏輯

Route handler 應只做：

- auth
- validation
- call domain service
- map response

因此主測試重點應放在 domain service，而不是 route handler 本身。

### 3.3 第三方整合先以 Fake 驗證流程

對 LINE、LLM、Supabase admin client：

- domain unit test 階段一律 fake
- integration test 再測真實串接

## 4. 目前採用的測試工具

- `node:test`
- `node:assert/strict`
- `node --import tsx --test`

原因：

- 不需額外安裝大型 test framework
- 與目前專案依賴最小衝突
- 足夠覆蓋 domain unit tests

執行指令：

```bash
pnpm test:backend
```

## 5. 目前已覆蓋的功能

### Tenant Onboarding

測試檔案：

- [setup-tenant.test.ts](/Users/howardchi/Desktop/2026/abo-agent-by-own/tests/backend/tenant/setup-tenant.test.ts)

目前覆蓋：

1. 已有 membership 時，直接回傳既有 tenant
2. 首次建立時，會依序 bootstrap tenant / member / agent / knowledge base / scenarios / handoff rule
3. bootstrap 過程失敗時，會執行 tenant compensation delete

### Session Resolution

測試檔案：

- [session.test.ts](/Users/howardchi/Desktop/2026/abo-agent-by-own/tests/backend/auth/session.test.ts)

目前覆蓋：

1. 一般 tenant owner 會帶出 tenant context
2. 沒有 membership 的登入者仍會被視為 tenant owner，但沒有 tenantId
3. platform admin 會被解析為 `platform_admin`，並保留 tenant context

### Auth Guards / Tenant Route Boundary

測試檔案：

- [guards.test.ts](/Users/howardchi/Desktop/2026/abo-agent-by-own/tests/backend/auth/guards.test.ts)
- [tenant-route.test.ts](/Users/howardchi/Desktop/2026/abo-agent-by-own/tests/backend/http/tenant-route.test.ts)

目前覆蓋：

1. tenant owner 與 platform admin 的 tenant access 判斷
2. setup pending 使用者不可通過 tenant-scoped guard
3. tenant-scoped route helper 會把 `AuthError` 正確轉成 API fail response
4. 非 auth 類錯誤會繼續往上拋，避免被誤吞

### Agent / Scenario Domain

測試檔案：

- [get-current-agent.test.ts](/Users/howardchi/Desktop/2026/abo-agent-by-own/tests/backend/agent/get-current-agent.test.ts)
- [list-scenarios.test.ts](/Users/howardchi/Desktop/2026/abo-agent-by-own/tests/backend/scenario/list-scenarios.test.ts)
- [select-scenario.test.ts](/Users/howardchi/Desktop/2026/abo-agent-by-own/tests/backend/scenario/select-scenario.test.ts)

目前覆蓋：

1. agent 讀取與更新會帶 tenant 範圍進 repository
2. scenario 列表與更新會帶 tenant 與 scenario id 進 repository
3. 規則式 scenario routing 的優先序與 fallback

## 6. 下一步建議補的測試

優先順序：

1. `getSessionUser()` integration tests
2. `/api/tenant/setup` integration / route tests
3. webhook ingestion unit tests
4. handoff keyword unit tests
5. runtime orchestration unit tests
6. conversation state transition tests

## 7. 對這個專案的具體建議

短期：

- 所有新的 domain service 都先做 repository injection
- route handler 只保留 auth / validation / response mapping，重複邏輯可抽 helper
- 每個主流程至少有一個成功測試與一個失敗補償或中止測試

中期：

- 建一組 Supabase integration test 環境
- 先補 onboarding / auth / tenant isolation 的 integration tests
- runtime 與 webhook 改為真實資料流後，再補 workflow integration tests

長期：

- 補 smoke test 驗證 login -> setup -> dashboard
- 補 webhook -> runtime 主流程 smoke test
