import { PageSection } from "@/components/layout/page-section";
import { PlaygroundRunner } from "@/components/merchant/playground-runner";

export default function PlaygroundPage() {
  return (
    <PageSection title="Playground" description="驗證 scenario routing 與 knowledge retrieval。">
      <PlaygroundRunner />
    </PageSection>
  );
}
