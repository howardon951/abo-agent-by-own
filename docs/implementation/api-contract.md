# API Contract v0.1

## 1. 共通規則

### 1.1 Base URL

- App APIs: `/api/...`
- Public webhook: `/api/webhooks/line`

### 1.2 Auth

- Merchant / Platform API 使用 Supabase session cookie
- Webhook 使用 LINE signature 驗證，不走 session

### 1.3 Response Shape

成功：

```json
{
  "data": {},
  "error": null
}
```

失敗：

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "channel_secret is required"
  }
}
```

## 2. Merchant APIs

### 2.1 POST `/api/tenant/setup`

用途：

- 商家第一次登入後完成初始租戶建立

Request:

```json
{
  "tenantName": "Abo Coffee",
  "slug": "abo-coffee"
}
```

Response:

```json
{
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "Abo Coffee",
      "slug": "abo-coffee",
      "status": "active"
    }
  },
  "error": null
}
```

### 2.2 GET `/api/agent`

用途：

- 讀取當前 tenant 的唯一 active agent

Response:

```json
{
  "data": {
    "agent": {
      "id": "uuid",
      "name": "Main Agent",
      "brandName": "Abo Coffee",
      "brandTone": "親切、簡短、專業",
      "forbiddenTopics": ["醫療建議", "法律意見"],
      "fallbackPolicy": "不確定時請保守回答並引導真人"
    }
  },
  "error": null
}
```

### 2.3 PATCH `/api/agent`

Request:

```json
{
  "name": "Main Agent",
  "brandName": "Abo Coffee",
  "brandTone": "親切、簡短、專業",
  "forbiddenTopics": ["醫療建議", "法律意見"],
  "fallbackPolicy": "若資料不足，請保守回答並請用戶稍候"
}
```

### 2.4 GET `/api/scenarios`

Response:

```json
{
  "data": {
    "scenarios": [
      {
        "id": "uuid",
        "scenarioType": "general_faq",
        "name": "一般 FAQ",
        "routingKeywords": [],
        "promptConfig": {},
        "isEnabled": true
      }
    ]
  },
  "error": null
}
```

### 2.5 PATCH `/api/scenarios/:scenarioId`

Request:

```json
{
  "name": "售前問答",
  "routingKeywords": ["價格", "費用", "方案"],
  "promptConfig": {
    "objective": "回答購買前常見問題",
    "style": "清楚、避免過度推銷"
  },
  "isEnabled": true
}
```

### 2.6 POST `/api/knowledge/documents`

用途：

- 建立 FAQ / PDF / URL 文件

Request for FAQ:

```json
{
  "sourceType": "faq",
  "title": "常見問題",
  "rawText": "Q: 幾點營業？ A: 每日 10:00-20:00"
}
```

Request for URL:

```json
{
  "sourceType": "url",
  "title": "門市資訊頁",
  "sourceUrl": "https://example.com/store-info"
}
```

Response:

```json
{
  "data": {
    "document": {
      "id": "uuid",
      "processingStatus": "queued"
    }
  },
  "error": null
}
```

### 2.7 GET `/api/knowledge/documents`

Response:

```json
{
  "data": {
    "documents": [
      {
        "id": "uuid",
        "title": "門市資訊頁",
        "sourceType": "url",
        "processingStatus": "ready",
        "lastProcessedAt": "2026-04-01T12:00:00Z"
      }
    ]
  },
  "error": null
}
```

### 2.8 DELETE `/api/knowledge/documents/:documentId`

用途：

- 刪除文件與關聯 chunks

### 2.9 GET `/api/line/connect`

用途：

- 讀取目前 tenant 的 LINE 綁定狀態
- 僅回傳安全欄位，不回傳 secret / access token

Response:

```json
{
  "data": {
    "channel": {
      "id": "uuid",
      "provider": "line",
      "name": "Abo LINE OA",
      "channelIdExternal": "2001234567",
      "status": "connected",
      "webhookUrl": "https://app.example.com/api/webhooks/line",
      "webhookVerifiedAt": null
    }
  },
  "error": null
}
```

### 2.10 POST `/api/line/connect`

Request:

```json
{
  "name": "Abo LINE OA",
  "channelIdExternal": "2001234567",
  "channelSecret": "secret",
  "channelAccessToken": "token"
}
```

Response:

```json
{
  "data": {
    "channel": {
      "id": "uuid",
      "provider": "line",
      "name": "Abo LINE OA",
      "channelIdExternal": "2001234567",
      "status": "connected",
      "webhookUrl": "https://app.example.com/api/webhooks/line",
      "webhookVerifiedAt": null
    }
  },
  "error": null
}
```

說明：

- `channelSecret` 與 `channelAccessToken` 為 write-only，成功儲存後不會再回填給前端。

### 2.11 GET `/api/conversations`

Query params:

- `status`
- `cursor`
- `limit`

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "contactDisplayName": "LINE User",
        "status": "bot_active",
        "lastMessageAt": "2026-04-01T13:00:00Z",
        "lastMessageSnippet": "請問你們今天營業到幾點？"
      }
    ],
    "nextCursor": null
  },
  "error": null
}
```

### 2.12 GET `/api/conversations/:conversationId`

Response:

```json
{
  "data": {
    "conversation": {
      "id": "uuid",
      "status": "human_active",
      "contact": {
        "id": "uuid",
        "displayName": "LINE User"
      },
      "messages": [
        {
          "id": "uuid",
          "role": "user",
          "content": "我要找真人",
          "createdAt": "2026-04-01T13:00:00Z"
        }
      ]
    }
  },
  "error": null
}
```

### 2.13 POST `/api/conversations/:conversationId/resume-bot`

用途：

- 從 `human_active` 恢復到 `bot_active`

Response:

```json
{
  "data": {
    "conversation": {
      "id": "uuid",
      "status": "bot_active"
    }
  },
  "error": null
}
```

### 2.14 POST `/api/playground/run`

Request:

```json
{
  "input": "今天營業到幾點？",
  "scenarioHint": "store_info"
}
```

Response:

```json
{
  "data": {
    "scenario": {
      "id": "uuid",
      "scenarioType": "store_info",
      "name": "門市資訊"
    },
    "retrieval": [
      {
        "documentTitle": "常見問題",
        "score": 0.92,
        "content": "營業時間為每日 10:00-20:00。"
      }
    ],
    "output": "我們每日營業時間為 10:00 到 20:00。"
  },
  "error": null
}
```

## 3. Platform APIs

### 3.1 POST `/api/platform/tenants`

用途：

- 平台管理員代建商家

Request:

```json
{
  "tenantName": "Abo Coffee",
  "slug": "abo-coffee",
  "ownerEmail": "owner@example.com",
  "planCode": "basic"
}
```

### 3.2 GET `/api/platform/tenants`

用途：

- 平台查看商家列表

### 3.3 GET `/api/platform/tenants/:tenantId`

用途：

- 平台查看商家詳情與設定摘要

### 3.4 PATCH `/api/platform/tenants/:tenantId`

用途：

- 平台變更商家狀態、方案或基礎設定

### 3.5 GET `/api/platform/logs/errors`

Query params:

- `tenantId`
- `from`
- `to`
- `status`

### 3.6 GET `/api/platform/usage`

Query params:

- `tenantId`
- `from`
- `to`
- `groupBy=day|tenant`

## 4. Public Integration API

### 4.1 POST `/api/webhooks/line`

用途：

- 接收 LINE webhook

Header:

- `x-line-signature`

Behavior:

- 驗證 signature
- 寫入 `webhook_events`
- 建立或更新 `contacts` / `conversations`
- 建立 `messages` / `message_jobs`
- 立即回 200

Response:

```json
{
  "data": {
    "ok": true
  },
  "error": null
}
```

## 5. 錯誤碼建議

- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `LINE_SIGNATURE_INVALID`
- `LINE_CHANNEL_NOT_CONNECTED`
- `DOCUMENT_PROCESSING_FAILED`
- `LLM_PROVIDER_ERROR`
- `RATE_LIMITED`
- `INTERNAL_ERROR`
