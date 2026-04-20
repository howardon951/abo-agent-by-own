import { PageSection } from "@/components/layout/page-section";

export default function AgentPage() {
  return (
    <PageSection title="Agent Settings" description="以表單設定品牌規則與 fallback。">
      <div className="panel card stack">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="agent-name">Agent Name</label>
            <input id="agent-name" defaultValue="Main Agent" />
          </div>
          <div className="field">
            <label htmlFor="brand-name">Brand Name</label>
            <input id="brand-name" defaultValue="Abo Coffee" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="brand-tone">Brand Tone</label>
          <textarea id="brand-tone" defaultValue="親切、簡短、專業" />
        </div>
        <div className="field">
          <label htmlFor="fallback">Fallback Policy</label>
          <textarea
            id="fallback"
            defaultValue="若資料不足，請保守回答並請用戶稍候，必要時轉真人。"
          />
        </div>
        <button className="button button-primary" type="button">
          Save settings
        </button>
      </div>
    </PageSection>
  );
}
