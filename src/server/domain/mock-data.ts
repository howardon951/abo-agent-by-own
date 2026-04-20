export const mockTenant = {
  id: "tenant-demo",
  name: "Abo Coffee",
  slug: "abo-coffee",
  status: "active"
};

export const mockAgent = {
  id: "agent-main",
  name: "Main Agent",
  brandName: "Abo Coffee",
  brandTone: "親切、簡短、專業",
  forbiddenTopics: ["醫療建議", "法律意見"],
  fallbackPolicy: "若資料不足，請保守回答並請用戶稍候"
};

export const mockScenarios = [
  {
    id: "scenario-general",
    scenarioType: "general_faq",
    name: "一般 FAQ",
    routingKeywords: [],
    promptConfig: { objective: "回答一般商家常見問題" },
    isEnabled: true
  },
  {
    id: "scenario-store",
    scenarioType: "store_info",
    name: "門市資訊",
    routingKeywords: ["地址", "營業時間", "停車"],
    promptConfig: { objective: "回答門市資訊問題" },
    isEnabled: true
  },
  {
    id: "scenario-sales",
    scenarioType: "pre_sales",
    name: "售前問答",
    routingKeywords: ["價格", "費用", "方案"],
    promptConfig: { objective: "回答售前問題" },
    isEnabled: true
  }
];

export const mockDocuments = [
  {
    id: "doc-faq",
    title: "常見問題",
    sourceType: "faq",
    processingStatus: "ready",
    lastProcessedAt: "2026-04-01T12:00:00Z"
  },
  {
    id: "doc-url",
    title: "門市資訊頁",
    sourceType: "url",
    processingStatus: "ready",
    lastProcessedAt: "2026-04-01T12:05:00Z"
  },
  {
    id: "doc-pdf",
    title: "產品手冊.pdf",
    sourceType: "pdf",
    processingStatus: "processing",
    lastProcessedAt: null
  }
];

export const mockConversations = [
  {
    id: "conv-1",
    contactDisplayName: "LINE User A",
    status: "bot_active",
    lastMessageAt: "2026-04-01T13:00:00Z",
    lastMessageSnippet: "請問今天營業到幾點？"
  },
  {
    id: "conv-2",
    contactDisplayName: "LINE User B",
    status: "human_active",
    lastMessageAt: "2026-04-01T13:05:00Z",
    lastMessageSnippet: "我要退貨"
  }
];
