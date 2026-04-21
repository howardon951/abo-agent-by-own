# 商業流程完成度

更新日期：2026-04-21

| 流程 | 目前狀態 | 現況判斷 | 下一步 |
| --- | --- | --- | --- |
| 商家註冊 / 登入 | 部分完成 | Supabase session、role/guard 基線已完成，登入 / 註冊導流規則與 backend 測試已補上；整體 auth UX 與 end-to-end 驗證仍可再補強。 | 補前端 auth 成功 / 失敗 / 驗證信導流的整合測試。 |
| 商家首次開通 tenant | 已完成 | `tenant -> member -> agent -> knowledge base -> scenarios -> handoff rule` 已真實寫入，成功 / 失敗 / 重複建立的 backend 測試已補齊。 | 補前台 onboarding happy path 的整合測試。 |
| 商家管理 Agent 設定 | 已完成 | `/agent` 已接真實 API，可讀取與更新 active agent 設定。 | 補 prompt versioning 與設定變更審計。 |
| 商家管理 Scenarios | 已完成 | `/scenarios` 已接真實 API，可讀取與逐筆更新 scenario 設定。 | 改成 runtime 直接讀 tenant scenario/routing 規則。 |
| 商家上傳知識庫 FAQ/PDF/URL | 未完成 | 仍以 mock list/create/delete 為主，沒有真實文件入庫與處理。 | 先做 FAQ / URL 真實落庫，再補 PDF。 |
| 知識庫處理流程 | 未完成 | 尚未有 chunking、embedding、背景處理與 processing status 流轉。 | 建 document job pipeline。 |
| LINE OA 綁定 | 已完成 | `/line` 已會寫入 `channels` / `line_channel_configs`，並加密儲存 channel secret / access token。 | 補 webhook verified timestamp 與連線健康檢查。 |
| Webhook 驗簽 | 已完成 | LINE signature 已實作 HMAC-SHA256 驗證。 | 補 verify 成功後的 verified timestamp 回寫。 |
| Webhook 收訊入庫 | 已完成 | 會寫入 `webhook_events`、`contacts`、`conversations`、`messages`，並建立 `message_jobs`。 | 補 assistant message persistence 與更多事件型別處理。 |
| Message Job Queue | 已完成 | `enqueue` / `claim` / `complete` / `fail` 已接真實 `message_jobs`，包含 lease、retry 與 dead-letter。 | 之後再評估多 worker / 更嚴格原子 claim。 |
| Worker 背景處理 | 部分完成 | 已改成常駐 polling worker，能處理真實 queue 並回覆 LINE；但 runtime 仍使用 mock scenario / retrieval / LLM。 | 補 assistant reply 落庫與 runtime state。 |
| Scenario Routing | 部分完成 | runtime 已有基本 scenario 選擇，但仍是硬編碼 keyword matcher，未讀 tenant scenario 設定。 | 改為讀 DB scenario/routing keywords。 |
| Retrieval / RAG | 未完成 | 仍是 mock retrieval，未查 `knowledge_chunks`。 | 先做簡化全文檢索或向量查詢。 |
| LLM 回覆 | 未完成 | 已可透過真實 LINE reply API 回覆，但內容仍來自 mock provider，不是真實模型。 | 接 LLM provider 與 prompt assembly。 |
| 回覆 LINE | 已完成 | worker 已會使用真實 LINE Messaging API reply message。 | 補 reply 失敗錯誤分類與 observability 聚合。 |
| 轉真人 handoff | 未完成 | schema 與預設 handoff rule 已有，但 runtime 尚未進行 handoff 判斷與狀態落庫。 | 在 runtime 加 handoff keyword 與狀態切換。 |
| 手動恢復 bot | 未完成 | API / 頁面入口仍為 mock，尚未真正更新 conversation 狀態。 | 真正更新 conversation status 並補 UI。 |
| 對話紀錄列表/詳情 | 未完成 | 頁面與 API 多數仍是 mock data，尚未讀 `conversations` / `messages`。 | 改查 DB，並補 assistant reply persistence。 |
| Playground 測試 | 部分完成 | 有頁面與 API，但流程仍走 demo runtime，而不是真實 tenant runtime。 | 改走真實 scenario + retrieval + llm。 |
| 平台管理商家 | 部分完成 | 有頁面 / API 骨架，但 tenant / plan / line 狀態多數仍是 mock。 | 接真實 `tenants` / `subscriptions` / `channels`。 |
| 平台 usage / 成本報表 | 未完成 | 尚未讀 `usage_records`，目前只有假數字。 | 實作 usage aggregation。 |
| 平台錯誤 / logs | 未完成 | 頁面 / API 仍是寫死資料；目前只有應用層 log，未聚合到後台。 | 先接 webhook / job / llm / document error logs。 |
| Plan / tier gating | 未完成 | schema 有 `plans` / `tenant_subscriptions`，但 runtime 與 UI 沒有 quota / feature gating。 | 先做 quota check 與 feature flag gating。 |
| Prompt versioning | 未完成 | schema 有 `agent_prompt_versions`，但 agent / scenario 設定更新尚未產生版本。 | 在 agent / scenario 更新時保存 prompt snapshot。 |
| 可觀測性 | 部分完成 | runtime / webhook / worker / document stub 已補應用層 log，但還沒有完整寫入 logs / usage tables 與後台頁。 | 補結構化 log persistence 與平台監控頁。 |

## 目前已打通的主線

- 商家登入後可完成 tenant setup 與 merchant 導流。
- 商家可在 `/agent`、`/scenarios`、`/line` 管理真實設定。
- LINE channel 憑證會加密存入資料庫。
- LINE webhook 已可驗簽、收訊、入庫、建立 `message_jobs`。
- 常駐 worker 已可 claim job、跑 mock runtime，並透過真實 LINE reply API 回覆使用者。

## 目前最大的缺口

- assistant reply 尚未落庫到 `messages`，所以 conversation timeline 還不完整。
- runtime 仍未讀 tenant scenario 規則、知識庫 chunk、真實 LLM provider。
- handoff / resume bot / conversation detail / platform reporting 仍未完成。
