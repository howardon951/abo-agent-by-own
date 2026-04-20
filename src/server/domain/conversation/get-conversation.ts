export async function getConversation(conversationId: string) {
  return {
    conversation: {
      id: conversationId,
      status: conversationId === "conv-2" ? "human_active" : "bot_active",
      contact: {
        id: "contact-demo",
        displayName: conversationId === "conv-2" ? "LINE User B" : "LINE User A"
      },
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "我要找真人",
          createdAt: "2026-04-01T13:00:00Z"
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "已轉由真人協助，請稍候",
          createdAt: "2026-04-01T13:01:00Z"
        }
      ]
    }
  };
}
