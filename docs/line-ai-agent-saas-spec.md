# LINE AI Agent SaaS 產品架構與功能規格書

- 版本：v0.1
- 日期：2026-04-01
- 狀態：Draft for MVP execution
- 作者：Codex based on founder interview

## 1. 文件目的

本文件用於定義一個可落地開發的 `LINE OA 商家 AI Agent SaaS` MVP，作為後續產品設計、技術實作、資料表設計、任務拆分與對外溝通的共同基準。

本文件同時覆蓋四個面向：

- 功能性規格：系統要做什麼
- 技術性規格：系統怎麼做
- 市場性規格：系統賣給誰、解決什麼問題、如何定價
- 決策紀錄：哪些問題已拍板、哪些刻意延後

---

## 2. 一句話定義產品

這是一個讓商家可快速建立、設定、部署到 `LINE Official Account` 的 AI 回覆助手平台，商家可透過簡單後台管理品牌設定、Prompt、知識庫與轉真人規則，平台負責處理訊息接收、RAG 檢索、模型回覆與對話記錄。

---

## 3. 產品定位

### 3.1 產品類型

本產品定位為：

- `混合型 SaaS + 代營運平台`

代表平台要同時支援兩種服務模式：

- 自助型商家：商家自己註冊與設定
- 代營運型客戶：平台方代商家建立與維護配置

### 3.2 核心價值

對商家的核心價值不是「做一個萬能 Agent」，而是：

- 低門檻把 LINE OA 變成可用的 AI 客服/FAQ 助手
- 降低重複客服回覆成本
- 讓非技術商家也能用表單設定品牌 AI
- 用知識庫提升回覆品質
- 遇到敏感問題可快速轉真人

### 3.3 MVP 產品邊界

MVP 的產品定義應明確收斂為：

- `AI FAQ / 客服助手平台`

不是以下產品：

- 不是通用 workflow builder
- 不是 CRM
- 不是全通路客服中心
- 不是多 agent 協作平台
- 不是 tool calling marketplace

---

## 4. 市場規格

### 4.1 目標客群

MVP 主攻以下兩類：

1. 小型與中型商家
- 已有 LINE OA
- 主要需求是 FAQ、自動回覆、節省人工時間
- 無技術團隊

2. 代理營運與顧問型服務商
- 幫多個商家代操 LINE OA 或數位客服
- 需要可複製的建置流程
- 願意接受平台方代建代管

### 4.2 暫不主攻客群

- 大型企業客服中心
- 高度整合 ERP/CRM 的企業
- 高風險領域如醫療、法律、金融建議型客服

### 4.3 使用情境

- 回答營業時間、地址、交通、停車
- 回答產品/服務常見問題
- 回答門市資訊、價格區間、預約方式
- 篩選常見售前問題
- 客訴、退款、退貨、找真人等問題立即轉人工

### 4.4 市場切入策略

建議先用「窄場景、高可複製」切入，而不是廣義 AI 平台：

- 第一波切入：零售、餐飲、美業、診所外圍諮詢、教育服務
- 這些場景共通需求高，FAQ 明確，LINE OA 使用率高
- 先強調 `快速上線`、`低維護成本`、`避免漏接`，不要先強調複雜 AI 能力

### 4.5 商業模式

目前採 `功能 tier` 為主的方案設計。

建議初版方案：

- Basic
  - 1 商家 / 1 agent / 1 LINE OA
  - FAQ + PDF 知識庫
  - 基本自動回覆
  - 關鍵字轉真人

- Pro
  - 加入網址知識庫
  - 更多 scenario
  - Playground 測試
  - 更高訊息額度
  - 更完整 log

- Managed
  - 平台代建與代管
  - 客製 prompt 與知識庫整理
  - 優先支援

備註：

- MVP 可先不做自動扣款
- 可人工開通方案與配額
- 資料模型先保留 `plans` 與 `tenant_subscriptions`

---

## 5. 核心產品決策

本節用來拍板前面尚未定案的五個問題。

### 5.1 商家後台是否先只開放一個 agent

決策：

- `是，MVP 先只開放一個 tenant 對應一個 agent`

理由：

- 這是 UI 與資料複雜度最大的控制點
- 對一人開發而言，多 agent 會立刻帶來路由、知識庫掛載、版本管理與權限複雜度
- 使用者需求本質目前仍是「把這個商家的 LINE OA 接起來」，不是管理多 agent 編排

技術處理方式：

- 資料表仍保留 `agents` 表
- UI 與業務規則限制每個 tenant 僅啟用一個 agent
- 後續開放多 agent 時，不需重做底層模型

### 5.2 Playground 是否顯示命中的知識片段

決策：

- `是，但只在商家 owner / 平台 admin 後台可見`

理由：

- Prompt 與 RAG 若不可觀察，MVP 很快會陷入「不知道為什麼回這樣」的維運黑箱
- 顯示命中的知識片段能顯著降低調整成本
- 對產品來說，這是高價值、低實作成本的除錯能力

範圍限制：

- MVP 只顯示 top-k 命中文段與分數
- 不做完整 citation UI
- 不對終端顧客顯示

### 5.3 網頁知識庫是否先只做單頁抓取

決策：

- `是，MVP 只支援單頁抓取，不做整站爬蟲`

理由：

- 整站爬蟲會立刻引入 robots、頻率控制、重複頁、導覽頁、同步刷新等問題
- 單頁抓取已可覆蓋大量商家 FAQ、門市資訊、方案說明頁
- 對一人開發而言，單頁抓取可快速驗證需求與品質

延後項目：

- sitemap 匯入
- 多頁批次抓取
- 定期同步刷新

### 5.4 轉真人後 bot 是否完全停止直到手動恢復

決策：

- `是，MVP 採完全停止，直到商家手動恢復 bot`

理由：

- 目前 MVP 不做內建人工客服台，而是回到 LINE OA 原生後台接手
- 若 bot 沒有完全停止，最容易發生人工與 bot 同時回覆、體驗混亂
- 停用直到手動恢復是最安全、最可預測的規則

狀態定義：

- `bot_active`
- `handoff_requested`
- `human_active`
- `closed`

MVP 行為：

- 命中關鍵字後，conversation 進入 `human_active`
- 該對話後續訊息不再送 LLM
- 商家需在後台手動點擊「恢復 AI」

### 5.5 平台管理員後台與商家後台是否同一個 Next.js 專案

決策：

- `是，MVP 採同一個 Next.js 專案`

理由：

- 一人開發最重要的是降低部署、權限、共用元件、維運複雜度
- 平台後台與商家後台有大量共用資料模型與設定頁
- 分拆成兩個前端專案不會帶來足夠價值，反而會拖慢交付

實作策略：

- 同一個 app
- 用 route groups 與 role-based guard 區分平台頁與商家頁
- 如：
  - `/app/(platform)/...`
  - `/app/(merchant)/...`

---

## 6. 使用者角色

### 6.1 Platform Admin

權限：

- 建立與管理所有商家
- 代商家編輯 agent 設定
- 查看全平台對話、錯誤與 usage
- 開關方案功能

### 6.2 Tenant Owner

權限：

- 管理自己商家的 agent、知識庫、LINE OA 設定
- 查看自己商家的對話紀錄
- 處理轉真人狀態
- 使用 Playground

MVP 暫不做：

- 複雜 RBAC
- 多層角色如 editor、viewer、support

---

## 7. MVP 功能規格

### 7.1 註冊與登入

功能：

- 商家註冊
- 商家登入
- 建立 tenant
- 平台管理員代建 tenant

需求：

- 使用 Supabase Auth
- 登入後自動導向對應角色後台

### 7.2 Agent 設定

功能：

- 建立 agent 基本設定
- 編輯品牌名稱
- 編輯品牌語氣
- 編輯禁語與回答邊界
- 設定 fallback 規則

MVP UI 原則：

- 以表單為主，不要求商家直接手寫長 prompt
- 後台由系統把表單內容組成結構化 prompt

### 7.3 Scenario 管理

MVP 內建 scenario：

- 一般 FAQ
- 售前問答
- 售後問答
- 門市資訊

功能：

- 啟用/停用 scenario
- 編輯 scenario 補充規則
- 設定 scenario 關鍵字

MVP 路由方式：

- 優先用規則式路由
- 規則不命中時走一般 FAQ
- 未來再加入 LLM classifier

### 7.4 知識庫

支援來源：

- 手動 FAQ
- PDF
- 網址單頁抓取

功能：

- 上傳文件
- 查看處理狀態
- 重新同步文件
- 刪除文件

處理流程：

- 抽取文字
- chunking
- embedding
- 存入 `knowledge_chunks`

限制：

- 不做整站爬蟲
- 不做 DOCX、CSV 首版支援

### 7.5 LINE OA 串接

功能：

- 綁定 LINE channel access token / secret
- 顯示 webhook URL
- 驗證 LINE webhook
- 接收使用者文字訊息
- 回覆文字訊息

MVP 範圍：

- 只處理文字訊息
- 不處理 rich menu、卡片、圖片理解、影音訊息

### 7.6 轉真人

功能：

- 設定預設敏感關鍵字
- 商家自訂關鍵字
- 命中後暫停 bot
- 發送固定回覆：「已轉由真人協助，請稍候」

MVP 行為：

- 轉真人後只能由商家後台手動恢復
- 不做內建人工聊天介面
- 商家回到 LINE OA 原生後台接手

### 7.7 對話紀錄

功能：

- 查看 conversation 列表
- 查看每段對話訊息
- 顯示目前狀態
- 顯示 bot / human 狀態

MVP 顯示欄位：

- 聯絡人 ID
- 最後訊息時間
- 狀態
- 最近訊息摘要

### 7.8 Playground

功能：

- 商家在後台輸入測試問題
- 查看 AI 回覆
- 顯示命中的知識片段
- 顯示命中的 scenario

用途：

- 調整 prompt
- 驗證知識庫是否有命中
- 降低上線前錯誤

### 7.9 平台管理後台

功能：

- 建立商家
- 查詢商家
- 查看商家設定
- 查看全平台錯誤與 usage
- 代商家維護設定

---

## 8. 非功能性需求

### 8.1 安全性

- 所有租戶資料必須以 `tenant_id` 隔離
- 使用 Supabase RLS
- LINE channel secret 與 access token 必須加密儲存
- 管理端頁面須做 role-based access control

### 8.2 可觀測性

MVP 必須保留：

- webhook event log
- message job log
- retrieval log
- llm request/response metadata
- error log
- usage log

### 8.3 可維運性

- webhook 與 LLM 呼叫必須非同步化
- job 需有 retry 與 dead-letter 概念
- 文件處理與訊息處理需可分開重跑

### 8.4 隱私與資料處理

- 商家資料完全隔離
- 保留刪除 contact / conversation 的能力設計
- MVP 不先做完整合規中心，但資料模型應預留刪除與停用欄位

---

## 9. 技術架構

### 9.1 技術選型

- Frontend: Next.js App Router
- Backend: Next.js Route Handlers + service layer
- Auth: Supabase Auth
- Database: Supabase Postgres
- File Storage: Supabase Storage
- Vector Search: pgvector
- Worker: Node.js background worker
- Queue: Postgres table based queue
- Monitoring: Sentry + structured logs

### 9.2 架構原則

1. 單一資料庫，多租戶隔離
2. webhook 與 runtime 分離
3. prompt 結構化，不直接暴露成任意大字串
4. 先做可觀察的 RAG，不追求最強 RAG
5. 管理後台與平台後台共用同一前端專案

### 9.3 系統模組

1. Auth & Tenant Module
2. Agent Config Module
3. Scenario Module
4. Knowledge Base Module
5. Channel Integration Module
6. Message Ingestion Module
7. Agent Runtime Module
8. Conversation Viewer Module
9. Platform Admin Module
10. Usage & Logging Module

---

## 10. 系統流程

### 10.1 LINE 訊息處理流程

1. LINE 對 webhook endpoint 發送事件
2. 系統驗證 signature
3. 寫入 `webhook_events`
4. 去重
5. 建立或找到 `contact` 與 `conversation`
6. 寫入 `messages`
7. 建立 `message_jobs`
8. 立即回傳 HTTP 200
9. Worker 撈 job 開始處理
10. 判斷對話是否為 `human_active`
11. 若為真人模式，停止 bot 回覆
12. 否則判斷是否命中 handoff keyword
13. 命中則切換狀態並回覆固定轉真人訊息
14. 未命中則做 scenario routing
15. 查詢對話上下文
16. 查詢 knowledge chunks
17. 組 prompt
18. 呼叫 LLM
19. 回覆 LINE
20. 寫入 llm/retrieval/usage log

### 10.2 文件處理流程

1. 商家上傳 FAQ/PDF/URL
2. 建立 `knowledge_documents`
3. 背景工作抽取文字
4. chunking
5. embedding
6. 寫入 `knowledge_chunks`
7. 更新文件狀態為 ready

---

## 11. Prompt 與回覆設計

### 11.1 Prompt 分層

MVP 採結構化 Prompt 組裝：

1. Base System Prompt
- 品牌身份
- 品牌語氣
- 回答邊界
- 禁語

2. Scenario Prompt
- 售前、售後、FAQ、門市資訊等情境補充

3. Retrieval Context
- 從知識庫命中的段落

4. Runtime Policy
- 不得捏造
- 不確定時保守回覆
- 命中敏感問題要轉真人

### 11.2 Prompt 管理原則

- UI 不讓商家直接自由寫整段複雜 prompt
- 後台以表單為主，進階欄位為輔
- 所有 prompt 變更需存版本

### 11.3 Fallback 規則

當知識不足或信心不足時：

- 不可瞎答
- 應回覆保守說明
- 必要時引導聯繫真人

---

## 12. 資料模型

### 12.1 核心表

- `tenants`
- `tenant_members`
- `plans`
- `tenant_subscriptions`
- `agents`
- `agent_scenarios`
- `agent_prompt_versions`
- `agent_handoff_rules`
- `channels`
- `line_channel_configs`
- `knowledge_bases`
- `knowledge_documents`
- `knowledge_chunks`
- `contacts`
- `conversations`
- `messages`
- `message_jobs`
- `webhook_events`
- `retrieval_logs`
- `llm_logs`
- `usage_records`

### 12.2 MVP 資料關係

產品規則層：

- 1 tenant -> 1 active agent
- 1 tenant -> 1 line channel
- 1 tenant -> 1 shared knowledge base

資料模型層：

- 保留未來 1 tenant -> N agents
- 保留未來 1 agent -> N knowledge bases
- 保留未來 1 tenant -> N channels

### 12.3 必要欄位方向

`tenants`
- id
- name
- status
- plan_id
- created_at

`agents`
- id
- tenant_id
- name
- status
- brand_tone
- forbidden_topics
- fallback_policy
- created_at

`agent_scenarios`
- id
- tenant_id
- agent_id
- scenario_type
- name
- routing_keywords
- prompt_config
- is_enabled

`knowledge_documents`
- id
- tenant_id
- knowledge_base_id
- source_type
- source_url
- file_path
- processing_status
- checksum

`conversations`
- id
- tenant_id
- channel_id
- contact_id
- status
- last_message_at
- human_handoff_at

`messages`
- id
- tenant_id
- conversation_id
- role
- source
- content
- metadata
- created_at

`message_jobs`
- id
- tenant_id
- message_id
- status
- retry_count
- available_at
- last_error

---

## 13. API 邊界

### 13.1 Merchant Admin APIs

- `POST /api/tenant/setup`
- `GET /api/agent`
- `PATCH /api/agent`
- `GET /api/scenarios`
- `PATCH /api/scenarios/:id`
- `POST /api/knowledge/documents`
- `GET /api/knowledge/documents`
- `DELETE /api/knowledge/documents/:id`
- `POST /api/line/connect`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/playground/run`
- `POST /api/conversations/:id/resume-bot`

### 13.2 Platform Admin APIs

- `POST /api/platform/tenants`
- `GET /api/platform/tenants`
- `GET /api/platform/tenants/:id`
- `PATCH /api/platform/tenants/:id`
- `GET /api/platform/logs/errors`
- `GET /api/platform/usage`

### 13.3 Public / Integration APIs

- `POST /api/webhooks/line`

---

## 14. 部署規格

### 14.1 MVP 建議部署方式

- Next.js app：Vercel 或同級平台
- Supabase：DB/Auth/Storage
- Worker：Railway / Render / Cloud Run 三選一

理由：

- 主應用與背景工作分離
- 部署與監控簡單
- 一人開發可維持足夠靈活度

### 14.2 Secrets 管理

至少需管理：

- Supabase secret key
- LINE channel secret
- LINE channel access token
- LLM provider API key
- Sentry DSN

---

## 15. 風險與對策

### 15.1 風險：Prompt 過度自由導致品質不穩

對策：

- 後台採表單化設定
- 結構化 prompt assembly
- prompt versioning

### 15.2 風險：RAG 做太重拖慢開發

對策：

- 首版只做 FAQ/PDF/單頁 URL
- 不做重排序器與多路檢索
- 先求可用、可觀察

### 15.3 風險：bot 與人工同時回覆

對策：

- 一旦 handoff 即全面停止 bot
- 必須手動恢復

### 15.4 風險：多租戶資料外洩

對策：

- 全表 `tenant_id`
- Supabase RLS
- 平台權限與商家權限分離

### 15.5 風險：無法排查錯誤

對策：

- 必做 webhook / retrieval / llm / usage / error logs

---

## 16. 明確不做的事

以下項目刻意延後，不納入 MVP：

- 多通路整合
- 多 agent 協作
- 視覺化流程編排
- 自帶 API key
- 多模型選擇
- 內建人工客服聊天介面
- Rich menu builder
- 自動訂單查詢
- CRM 整合
- 自動扣款與完整 billing 系統

---

## 17. 開發順序建議

### Phase 1

- Auth / tenant / role guard
- Merchant 後台骨架
- Agent 設定頁
- LINE channel 設定頁

### Phase 2

- webhook 接收
- message / conversation 落庫
- message job worker
- 基本文字回覆

### Phase 3

- Knowledge base 上傳與處理
- retrieval
- prompt assembly
- scenario routing

### Phase 4

- handoff keyword
- human_active 狀態管理
- 對話紀錄頁
- Playground

### Phase 5

- Platform admin
- usage/logging page
- plan gating

---

## 18. 里程碑定義

### M0：技術驗證

- LINE webhook 可收訊
- LLM 可回覆
- 回覆可成功送回 LINE

### M1：可 demo

- 商家可設定品牌資訊
- 可綁 LINE OA
- 可收到 AI 回覆
- 可查看對話紀錄

### M2：可內測

- 可上傳知識庫
- 可做 scenario
- 可關鍵字轉真人
- 可用 Playground 測試

### M3：可收費試營運

- platform admin 可管理多商家
- 有基本 usage 與錯誤追蹤
- 有 tier gating

---

## 19. 執行建議總結

### 現在就拍板的事

- 一商家一 agent
- 知識庫先一個共享庫
- 網址只抓單頁
- 轉真人後 bot 完全停止直到手動恢復
- 平台後台與商家後台共用同一個 Next.js 專案

### 刻意先不處理的事

- 多 agent
- 多知識庫掛載
- LLM 路由器
- 整站爬蟲
- 完整客服工作台
- 複雜計費

### 最重要的工程原則

- 先把 `租戶隔離`、`訊息流水線`、`prompt 結構`、`可觀測性` 做對
- 不要在 MVP 把範圍拖成全功能客服平台

---

## 20. 下一步輸出建議

本文件完成後，下一份實作文件應直接產出：

1. Supabase schema.sql
2. ERD
3. Next.js 專案結構
4. 各頁面 wireframe
5. API contract
6. Worker job lifecycle 定義
