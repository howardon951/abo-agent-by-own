"use client";

import { startTransition, useState, type FormEvent } from "react";

type PlaygroundResponse = {
  data: {
    scenario: {
      id: string;
      scenarioType: string;
      name: string;
    };
    retrieval: Array<{
      documentTitle: string;
      score: number;
      content: string;
    }>;
    output: string;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

export function PlaygroundRunner() {
  const [input, setInput] = useState("今天營業到幾點？");
  const [scenarioHint, setScenarioHint] = useState("store_info");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlaygroundResponse["data"]>(null);

  async function runPlayground() {
    setIsRunning(true);

    try {
      const response = await fetch("/api/playground/run", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          input,
          scenarioHint: scenarioHint || undefined
        })
      });
      const json = (await response.json()) as PlaygroundResponse;

      if (!response.ok || !json.data) {
        throw new Error(json.error?.message ?? "執行 Playground 失敗");
      }

      setResult(json.data);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "執行 Playground 失敗");
    } finally {
      setIsRunning(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(() => {
      void runPlayground();
    });
  }

  return (
    <div className="grid-2">
      <form onSubmit={handleSubmit} className="panel card stack">
        {error ? (
          <div className="panel card" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="playground-scenario">Scenario Hint</label>
          <select
            id="playground-scenario"
            value={scenarioHint}
            onChange={(event) => setScenarioHint(event.target.value)}
            disabled={isRunning}
          >
            <option value="store_info">門市資訊</option>
            <option value="general_faq">一般 FAQ</option>
            <option value="pre_sales">售前問答</option>
            <option value="post_sales">售後問答</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="playground-input">Input</label>
          <textarea
            id="playground-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isRunning}
          />
        </div>
        <button className="button button-primary" type="submit" disabled={isRunning}>
          {isRunning ? "Running..." : "Run test"}
        </button>
      </form>
      <div className="panel card stack">
        <strong>Debug Result</strong>
        {result ? (
          <>
            <span>
              Scenario: {result.scenario.name} ({result.scenario.scenarioType})
            </span>
            <div className="stack" style={{ gap: 10 }}>
              <strong style={{ fontSize: 15 }}>Retrieved Context</strong>
              {result.retrieval.length === 0 ? (
                <span style={{ color: "var(--muted)" }}>沒有檢索到上下文。</span>
              ) : (
                result.retrieval.map((item, index) => (
                  <div key={`${item.documentTitle}-${index}`} className="panel card stack" style={{ gap: 6 }}>
                    <span>
                      {item.documentTitle} / score {item.score.toFixed(2)}
                    </span>
                    <span style={{ color: "var(--muted)" }}>{item.content}</span>
                  </div>
                ))
              )}
            </div>
            <div className="panel card">
              <strong>Output</strong>
              <p style={{ marginBottom: 0 }}>{result.output}</p>
            </div>
          </>
        ) : (
          <span style={{ color: "var(--muted)" }}>
            尚未執行，送出後會顯示 scenario、retrieval 與 output。
          </span>
        )}
      </div>
    </div>
  );
}
