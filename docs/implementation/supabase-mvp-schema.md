# Supabase MVP Schema Notes

本文件說明目前 `supabase/schema.sql` 這版 schema 的取向，聚焦 MVP 已經要用到的多租戶、LINE channel、knowledge、conversation 與 job queue。

## 1. 設計原則

- 產品規則先收斂：MVP 仍以 `1 tenant -> 1 active agent -> 1 primary LINE channel -> 1 default knowledge base` 為主。
- 資料模型保留擴充：schema 仍允許未來擴成多 agent、多 channel、多 knowledge base。
- 租戶隔離靠兩層保護：
  - 每張核心表都帶 `tenant_id`
  - 子表盡量用 `(tenant_id, id)` composite foreign key，避免跨租戶錯接資料
- 敏感與背景工作資料預設不直接暴露給 tenant-facing client：
  - `line_channel_configs`
  - `knowledge_chunks`
  - `message_jobs`

## 2. 這版新增或收斂的重點

### Tenant membership

- 拿掉原本混用平台角色的 `app_role`
- 改成 `tenant_member_role ('owner', 'admin')`
- `platform_admin` 仍獨立放在 `platform_admins`

這樣 tenant 內角色與平台角色不會混在一起，RLS 也比較容易維護。

### Tenant-safe foreign keys

以下核心表都補了 composite FK：

- `agent_scenarios -> agents`
- `line_channel_configs -> channels`
- `knowledge_documents -> knowledge_bases`
- `knowledge_chunks -> knowledge_bases / knowledge_documents`
- `contacts -> channels`
- `conversations -> channels / contacts / agents / agent_scenarios`
- `messages -> conversations`
- `message_jobs -> conversations / messages`

這是這版 schema 最重要的結構修正，因為單純的 `id` foreign key 無法阻止錯誤的跨 tenant 關聯。

### Message job queue

`message_jobs` 目前補了：

- `job_type`
- `locked_at`
- `lease_expires_at`
- `unique (message_id)`

目的是讓 worker 之後能做 lease-based claim，避免 worker crash 後 job 永遠卡在 `processing`。

## 3. RLS 原則

- `select` 以 `has_tenant_access(tenant_id)` 為主
- tenant 可改動的商家後台設定表，使用 `has_tenant_admin_access(tenant_id)`
- 平台管理相關操作可由 `platform_admins` 跨租戶存取
- backend-only tables 不直接開 tenant-facing RLS policy

目前比較偏向「商家設定可從 session client 操作；背景任務與 secrets 走 service role」。

## 4. 索引取向

目前先針對 MVP 真正會打到的查詢補索引：

- `tenant_members (user_id, tenant_id)`
- `agents (tenant_id, status)` 與 active partial unique index
- `agent_scenarios (agent_id, is_enabled, sort_order)`
- `channels (tenant_id, provider)` 與 primary partial unique index
- `knowledge_documents (tenant_id, processing_status, created_at desc)`
- `knowledge_chunks (document_id, chunk_index)`
- `conversations (tenant_id, status, last_message_at desc, id desc)`
- `messages (conversation_id, created_at, id)`
- `message_jobs (status, available_at, id)` 與 queued partial index

## 5. 已知限制與後續注意事項

- `line_channel_configs` 現在不開 tenant-facing RLS；未來如果商家 UI 要讀 channel 狀態，應優先用 safe view / RPC，而不是直接 expose base table。
- `knowledge_chunks.embedding` 目前仍固定 `vector(1536)`；如果後續要切換 embedding model，建議用新欄位或新表做版本化，不要硬改維度。
- onboarding 目前仍是多步寫入加補償刪除，還不是 DB transaction。之後如果流程變複雜，建議改成 SQL function / transaction。
- `usage_records`、`llm_logs`、`webhook_events` 這些觀測資料還沒做更細的 retention 策略，流量起來後要另外處理。
