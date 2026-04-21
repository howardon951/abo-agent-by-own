"use client";

import { startTransition, useEffect, useState } from "react";

type Scenario = {
  id: string;
  scenarioType: string;
  name: string;
  routingKeywords: string[];
  promptConfig: Record<string, unknown>;
  isEnabled: boolean;
};

type ScenariosResponse = {
  data: {
    scenarios: Scenario[];
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

type ScenarioResponse = {
  data: {
    scenario: Scenario;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

type ScenarioDraft = Scenario & {
  routingKeywordsInput: string;
  objectiveInput: string;
};

export function ScenariosManager() {
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadScenarios() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/scenarios", {
          credentials: "same-origin",
          cache: "no-store"
        });
        const json = (await response.json()) as ScenariosResponse;

        if (!response.ok || !json.data) {
          throw new Error(json.error?.message ?? "載入 Scenarios 失敗");
        }

        if (!isMounted) {
          return;
        }

        setScenarios(json.data.scenarios.map(toScenarioDraft));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "載入 Scenarios 失敗");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadScenarios();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateScenario(id: string, updates: Partial<ScenarioDraft>) {
    setScenarios((current) =>
      current.map((scenario) =>
        scenario.id === id
          ? {
              ...scenario,
              ...updates
            }
          : scenario
      )
    );
  }

  async function handleSave(scenario: ScenarioDraft) {
    setMessage(null);
    setError(null);

    startTransition(() => {
      void saveScenario(scenario);
    });
  }

  async function saveScenario(scenario: ScenarioDraft) {
    setSavingId(scenario.id);

    try {
      const response = await fetch(`/api/scenarios/${scenario.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: scenario.name,
          routingKeywords: splitKeywords(scenario.routingKeywordsInput),
          isEnabled: scenario.isEnabled,
          promptConfig: {
            ...scenario.promptConfig,
            objective: scenario.objectiveInput
          }
        })
      });
      const json = (await response.json()) as ScenarioResponse;

      if (!response.ok || !json.data) {
        throw new Error(json.error?.message ?? "更新 Scenario 失敗");
      }

      setScenarios((current) =>
        current.map((item) => (item.id === scenario.id ? toScenarioDraft(json.data!.scenario) : item))
      );
      setMessage(`Scenario「${json.data.scenario.name}」已更新`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "更新 Scenario 失敗");
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="panel card">
        <span style={{ color: "var(--muted)" }}>正在載入 Scenarios...</span>
      </div>
    );
  }

  return (
    <div className="stack">
      {error ? (
        <div className="panel card" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="panel card" style={{ color: "var(--success)" }}>
          {message}
        </div>
      ) : null}
      {scenarios.map((scenario) => {
        const isSaving = savingId === scenario.id;

        return (
          <section key={scenario.id} className="panel card stack">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center"
              }}
            >
              <div className="stack" style={{ gap: 6 }}>
                <strong>{labelForScenarioType(scenario.scenarioType)}</strong>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>
                  type={scenario.scenarioType}
                </span>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={scenario.isEnabled}
                  onChange={(event) => updateScenario(scenario.id, { isEnabled: event.target.checked })}
                  disabled={isSaving}
                />
                Enabled
              </label>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor={`scenario-name-${scenario.id}`}>Scenario Name</label>
                <input
                  id={`scenario-name-${scenario.id}`}
                  value={scenario.name}
                  onChange={(event) => updateScenario(scenario.id, { name: event.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="field">
                <label htmlFor={`scenario-keywords-${scenario.id}`}>Routing Keywords</label>
                <input
                  id={`scenario-keywords-${scenario.id}`}
                  value={scenario.routingKeywordsInput}
                  onChange={(event) =>
                    updateScenario(scenario.id, { routingKeywordsInput: event.target.value })
                  }
                  disabled={isSaving}
                  placeholder="價格, 費用, 方案"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor={`scenario-objective-${scenario.id}`}>Objective</label>
              <textarea
                id={`scenario-objective-${scenario.id}`}
                value={scenario.objectiveInput}
                onChange={(event) => updateScenario(scenario.id, { objectiveInput: event.target.value })}
                disabled={isSaving}
                placeholder="回答這類問題時的補充規則"
              />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="button button-primary"
                type="button"
                onClick={() => void handleSave(scenario)}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save scenario"}
              </button>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>
                關鍵字以逗號分隔，儲存後會更新 tenant 的 active agent scenario
              </span>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function toScenarioDraft(scenario: Scenario): ScenarioDraft {
  return {
    ...scenario,
    routingKeywordsInput: scenario.routingKeywords.join(", "),
    objectiveInput:
      typeof scenario.promptConfig.objective === "string" ? scenario.promptConfig.objective : ""
  };
}

function splitKeywords(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function labelForScenarioType(scenarioType: string) {
  switch (scenarioType) {
    case "general_faq":
      return "一般 FAQ";
    case "pre_sales":
      return "售前問答";
    case "post_sales":
      return "售後問答";
    case "store_info":
      return "門市資訊";
    default:
      return scenarioType;
  }
}
