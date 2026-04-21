# 商業流程完成度

更新日期：2026-04-21

## 商家主流程（化繁為簡）

先不要用技術模組看這個產品。對商家來說，流程其實只有 5 步：

1. 建立工作區
2. 接上 LINE 與知識庫
3. 決定 bot 怎麼說、怎麼分流
4. 看真實對話，必要時轉真人或 Resume AI
5. 用 Playground 驗證設定是否合理

| 階段 | 商家在做什麼 | 對應頁面 | 目前狀態 | 現況判斷 |
| --- | --- | --- | --- | --- |
| 1. Setup | 建立 tenant，初始化商家工作區 | `/setup` | 已完成 | tenant、member、agent、knowledge base、scenarios、handoff rule 已真實建立。 |
| 2. Launch | 把 bot 接到 LINE OA，並建立可回答的知識來源 | `/line`、`/knowledge` | 部分完成 | LINE channel 綁定已可真實寫入；Knowledge UI 已可操作，但底層仍是 mock documents，未進入真實 document pipeline。 |
| 3. Behavior | 定義 bot 的品牌語氣、禁答範圍、場景分流 | `/agent`、`/scenarios` | 部分完成 | Agent / Scenario 設定已接真實 DB；但 runtime 仍未真正讀取 scenario 規則與 prompt assembly。 |
| 4. Inbox | 觀察對話、查看 timeline、人工接手、Resume AI | `/conversations` | 部分完成 | 對話列表與 detail 已接真實資料；handoff / resume 基礎流程已成立，但仍缺真實 scenario / retrieval / llm runtime。 |
| 5. Validate | 用測試工具確認路由與回覆是否合理 | `/playground` | 部分完成 | Playground UI / API 可用，但底層仍是 demo runtime，不是真實 tenant runtime。 |

## 商家目前已經能做什麼

- 註冊登入後完成第一次工作區初始化。
- 在後台綁定 LINE OA，儲存加密後的 channel secret / token。
- 修改 Agent 品牌設定與 Scenario 規則。
- 查看真實 webhook 進來後建立的 conversations / messages。
- 對 `human_active` 對話執行 `Resume AI`。
- 用 Playground 測試目前設定的大致輸出形態。

## 商家目前還不能期待什麼

- 知識庫還沒有真實 document ingestion、chunking、embedding、retrieval。
- Scenario 雖可配置，但 runtime 仍未真正按 tenant 規則路由。
- LLM 仍是 mock provider，不是真實模型。
- Playground 看到的是 demo runtime，不是正式線上 runtime。
- 平台報表、usage、logs 仍不是實際營運數據。

## 落地追蹤（保留必要細節）

| 能力 | 目前狀態 | 現況判斷 | 下一步 |
| --- | --- | --- | --- |
| 商家註冊 / 登入 | 部分完成 | Supabase session、role/guard、登入/註冊後導流已完成；auth UX 與完整前台 flow 仍待整合驗證。 | 補前端 auth 整合測試與錯誤流。 |
| Tenant Setup | 已完成 | `tenant -> member -> agent -> knowledge base -> scenarios -> handoff rule` 已真實寫入 DB。 | 補 onboarding E2E。 |
| LINE OA 綁定 | 部分完成 | `channels` / `line_channel_configs` 已真實寫入且敏感資料有加密。 | 補 verified timestamp 與 health check。 |
| Knowledge 文件管理 | 部分完成 | 前台已可 list/create/delete；底層仍是 mock documents，不是真實 `knowledge_documents`。 | 先做 FAQ / URL 真實落庫。 |
| Knowledge 處理流程 | 未完成 | 尚未有 chunking、embedding、document job、processing status 流轉。 | 建 document pipeline。 |
| Agent 設定 | 部分完成 | `/agent` 已接真實 API，可讀寫 active agent。 | 補 prompt assembly、versioning、audit。 |
| Scenario 設定 | 部分完成 | `/scenarios` 已接真實 API，可讀寫 scenario。 | 改成 runtime 直接讀 `agent_scenarios`。 |
| Webhook 驗簽與收訊 | 已完成 | LINE signature 驗證、event 去重、contacts / conversations / messages / jobs 入庫都已成立。 | 補更多 event type 與 processed status。 |
| Message Job Queue | 已完成 | `claim / complete / fail / retry / dead-letter` 已接真實 `message_jobs`。 | 視流量再強化原子 claim 與多 worker。 |
| Runtime handoff / assistant persistence | 部分完成 | `human_active` skip、handoff reply、assistant message 落庫、Resume AI 基礎已成立。 | 補 runtime 讀真實 scenario / retrieval / llm。 |
| Conversations Inbox | 部分完成 | 列表 / detail 已接真實資料，並有 master-detail UI。 | 補更多篩選、狀態操作與真實 runtime metadata。 |
| Playground | 部分完成 | 頁面與 API 可用，但仍走 demo runtime。 | 改走真實 tenant runtime。 |
| Platform 報表 / logs | 未完成 | tenants / usage / logs 仍多為 mock。 | 接真實 `tenants`、`usage_records`、錯誤聚合。 |
| Prompt versioning / observability | 未完成 | schema 已有，但尚未形成實際寫入流程。 | 補 `agent_prompt_versions`、`retrieval_logs`、`llm_logs`、`usage_records`。 |

## 下一步優先順序

1. 把 Knowledge 底層從 mock documents 換成真實 `knowledge_documents`。
2. 讓 runtime 真正讀 tenant scenario 規則，而不是硬編碼 keyword matcher。
3. 把 retrieval / LLM 從 mock 換成真實 provider 與真實資料流。
4. 補 usage、logs、prompt versioning，讓平台後台開始有可營運的觀測資料。
