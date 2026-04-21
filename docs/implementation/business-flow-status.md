# 商業流程完成度

更新日期：2026-04-21

| 流程 | 目前狀態 | 現況判斷 | 下一步 |
| --- | --- | --- | --- |
| 商家註冊 / 登入 | 部分完成 | Supabase session、role/guard、登入/註冊後導流已完成；auth UX 與整條前台 happy path 還沒完整驗證。 | 補前端 auth 整合測試與錯誤流。 |
| 商家首次開通 tenant | 已完成 | `tenant -> member -> agent -> knowledge base -> scenarios -> handoff rule` 已真實寫入 DB。 | 補 onboarding E2E 測試。 |
| 商家管理 Agent 設定 | 部分完成 | `/agent` 已接真實 API，可讀寫 active agent；但設定尚未完整進入 runtime/prompt assembly。 | 補 prompt assembly、versioning、audit。 |
| 商家管理 Scenarios | 部分完成 | `/scenarios` 已接真實 API，可讀寫 scenario；但 runtime 仍未讀 DB scenario 規則。 | 改成 runtime 直接讀 `agent_scenarios`。 |
| 商家上傳知識庫 FAQ/PDF/URL | 未完成 | 目前仍是 mock list/create/delete，沒有真實 `knowledge_documents` 寫入。 | 先做 FAQ / URL 真實落庫。 |
| 知識庫處理流程 | 未完成 | 尚未有 chunking、embedding、document job、processing status 流轉。 | 建 document pipeline。 |
| LINE OA 綁定 | 部分完成 | 可真實寫入 `channels` / `line_channel_configs`，且敏感資料有加密；但未驗證 webhook 成功與健康狀態。 | 補 verified timestamp 與 health check。 |
| Webhook 驗簽 | 已完成 | LINE signature HMAC-SHA256 驗證已實作。 | 補驗證成功後的狀態回寫。 |
| Webhook 收訊入庫 | 已完成 | 會寫入 `webhook_events`、`contacts`、`conversations`、`messages`，並建立 `message_jobs`。 | 補更多 event type 與 processed status。 |
| Message Job Queue | 已完成 | `claim / complete / fail / retry / dead-letter` 已接真實 `message_jobs`。 | 之後再強化原子 claim 與多 worker。 |
| Worker 背景處理 | 部分完成 | 常駐 polling worker 已可處理真實 queue 並回 LINE；但 runtime 內容仍是 mock。 | 補 conversation state、assistant message、logs。 |
| Scenario Routing | 部分完成 | 已有基本 keyword matcher；但完全沒讀 tenant 自訂 scenario 設定。 | 改讀 DB routing keywords。 |
| Retrieval / RAG | 未完成 | 仍是 mock retrieval，未查 `knowledge_chunks`。 | 先做全文檢索，再補向量查詢。 |
| LLM 回覆 | 未完成 | 雖然能回 LINE，但內容仍來自 mock provider，不是真實模型。 | 接真實 LLM provider 與 prompt assembly。 |
| Assistant 回覆落庫 | 未完成 | 目前只有 user message 會寫入 `messages`，assistant reply 不會落庫。 | 在 runtime 成功回覆後寫 assistant message。 |
| 回覆 LINE | 已完成 | worker 已會使用真實 LINE Messaging API reply message。 | 補 reply failure 分類與重試策略。 |
| 轉真人 handoff | 未完成 | schema 與預設 rule 已有，但 runtime 未做 handoff 判斷，也未阻止 `human_active` 對話繼續回覆。 | 補 handoff keyword、conversation status transition、skip LLM。 |
| 手動恢復 bot | 未完成 | API / UI 入口存在，但仍是 stub，沒有真正更新 conversation 狀態。 | 真實更新 `conversations.status`。 |
| 對話紀錄列表/詳情 | 未完成 | 頁面、API、domain 目前都還是 mock data。 | 改查 `conversations` / `messages` 真實資料。 |
| Playground 測試 | 部分完成 | 有頁面與 API，但流程仍走 demo runtime。 | 改走真實 scenario + retrieval + llm。 |
| 平台管理商家 | 未完成 | 有頁面 / API 骨架，但 tenant / plan / line status 仍是 mock。 | 接真實 `tenants` / `tenant_subscriptions` / `channels`。 |
| 平台 usage / 成本報表 | 未完成 | `usage_records` 雖有 schema，但完全未寫入、未聚合。 | 實作 usage aggregation。 |
| 平台錯誤 / logs | 未完成 | 後台頁與 API 仍是寫死資料。 | 先接 webhook / job / llm / document error logs。 |
| Plan / tier gating | 未完成 | schema 有 `plans` / `tenant_subscriptions`，runtime 與 UI 都沒做 quota / feature gating。 | 先做 quota check。 |
| Prompt versioning | 未完成 | schema 有 `agent_prompt_versions`，但目前沒有任何寫入點。 | 在 agent / scenario 更新時保存 snapshot。 |
| 可觀測性 | 部分完成 | 應用層 log 有了，但 `llm_logs` / `retrieval_logs` / `usage_records` 尚未真正寫入。 | 補結構化 persistence 與平台監控頁。 |

## 目前已打通的主線

- 商家登入後，系統可辨識 session、角色與 tenant 狀態，並導流到 `/dashboard` 或 `/setup`。
- 商家可完成首次 tenant 開通，系統會真實建立 tenant、member、agent、knowledge base、scenarios、handoff rule。
- 商家可在 `/agent` 與 `/scenarios` 頁面讀取和修改真實資料庫中的設定。
- 商家可在 `/line` 綁定 LINE OA，系統會把 channel secret / access token 加密後寫入資料庫。
- LINE webhook 已可完成驗簽、事件去重、聯絡人建立或更新、對話建立或續接、使用者訊息落庫。
- webhook 收到的新訊息會建立 `message_jobs`，worker 可 claim job、處理 job、失敗重試，並透過真實 LINE reply API 回覆使用者。

## 目前最大的缺口

- runtime 仍未讀 tenant 自訂 scenario 規則，現在的 scenario routing 只是硬編碼 keyword matcher。
- retrieval 仍是 mock，尚未使用 `knowledge_documents` / `knowledge_chunks`，所以知識庫對回覆品質還沒有真正作用。
- LLM provider 仍是 mock，現在雖然能真的回 LINE，但回覆內容不是來自真實模型。
- assistant reply 尚未落庫到 `messages`，因此 conversation timeline、對話詳情、usage、llm logs 都無法完整成立。
- handoff 邏輯尚未真正打通。雖然 schema 和預設 rule 已有，但 runtime 沒有做 handoff 判斷，也沒有在 `human_active` 時停止 bot。
- Resume AI 仍是 stub，尚未真正更新 `conversations.status`。
- 對話列表 / 對話詳情頁面與 API 仍主要依賴 mock data，尚未反映真實資料庫內容。
- 知識庫上傳與文件處理流程尚未落地，`knowledge_documents`、chunking、embedding、document jobs 都還沒接上。
- 平台後台的 tenants / usage / error logs 目前仍是 mock，尚未讀取真實營運資料。
- `prompt versioning`、`usage_records`、`retrieval_logs`、`llm_logs` 雖然 schema 已有，但目前幾乎沒有實際寫入流程。
