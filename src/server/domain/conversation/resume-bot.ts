export async function resumeConversationBot(conversationId: string) {
  return {
    conversation: {
      id: conversationId,
      status: "bot_active"
    }
  };
}
