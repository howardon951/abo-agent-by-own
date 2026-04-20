import { mockScenarios } from "@/server/domain/mock-data";

export async function listScenarios() {
  return { scenarios: [...mockScenarios] };
}

export async function updateScenario(
  scenarioId: string,
  input: {
    name?: string;
    routingKeywords?: string[];
    promptConfig?: Record<string, unknown>;
    isEnabled?: boolean;
  }
) {
  const current =
    mockScenarios.find((scenario) => scenario.id === scenarioId) ?? mockScenarios[0];

  return {
    scenario: {
      ...current,
      ...input
    }
  };
}
