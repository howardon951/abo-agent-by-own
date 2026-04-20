import { mockConversations } from "@/server/domain/mock-data";

export async function listConversations() {
  return {
    items: [...mockConversations],
    nextCursor: null
  };
}
