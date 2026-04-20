import { PageSection } from "@/components/layout/page-section";

export default function PlaygroundPage() {
  return (
    <PageSection title="Playground" description="驗證 scenario routing 與 knowledge retrieval。">
      <div className="grid-2">
        <div className="panel card stack">
          <div className="field">
            <label htmlFor="playground-input">Input</label>
            <textarea id="playground-input" defaultValue="今天營業到幾點？" />
          </div>
          <button className="button button-primary" type="button">
            Run test
          </button>
        </div>
        <div className="panel card stack">
          <strong>Debug Result</strong>
          <span>Scenario: 門市資訊</span>
          <span>Retrieved: FAQ score 0.92</span>
          <span>Output: 我們每日營業時間為 10:00 到 20:00。</span>
        </div>
      </div>
    </PageSection>
  );
}
