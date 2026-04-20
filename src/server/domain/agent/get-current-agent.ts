import { mockAgent } from "@/server/domain/mock-data";

export async function getCurrentAgent() {
  return { agent: mockAgent };
}

export async function updateCurrentAgent(input: Partial<typeof mockAgent>) {
  return {
    agent: {
      ...mockAgent,
      ...input
    }
  };
}
