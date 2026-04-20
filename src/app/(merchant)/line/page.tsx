import { PageSection } from "@/components/layout/page-section";

export default function LinePage() {
  return (
    <PageSection title="LINE Integration" description="設定 channel secret、token 與 webhook。">
      <div className="panel card stack">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="channel-name">Channel Name</label>
            <input id="channel-name" defaultValue="Abo LINE OA" />
          </div>
          <div className="field">
            <label htmlFor="channel-id">LINE Channel ID</label>
            <input id="channel-id" defaultValue="2001234567" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="channel-secret">Channel Secret</label>
          <input id="channel-secret" placeholder="LINE channel secret" />
        </div>
        <div className="field">
          <label htmlFor="channel-token">Channel Access Token</label>
          <textarea id="channel-token" placeholder="LINE channel access token" />
        </div>
        <div className="panel card">
          <div className="stack" style={{ gap: 6 }}>
            <strong>Webhook URL</strong>
            <span className="mono">http://localhost:3000/api/webhooks/line</span>
          </div>
        </div>
        <button className="button button-primary" type="button">
          Save channel
        </button>
      </div>
    </PageSection>
  );
}
