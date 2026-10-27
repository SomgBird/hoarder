import { useState } from "react";
import { PageEditorWizard } from "./PageEditorWizard/PageEditorWizard";
import { PageEditorWorkspace } from "./PageEditorWorkspace/PageEditorWorkspace";
import type { PageData } from "./pageTypes";

export function PageEditor() {
  // null = still in the wizard, otherwise the wizard's result
  const [pageData, setPageData] = useState<PageData | null>(null);

  if (!pageData) {
    return <PageEditorWizard onFinish={setPageData} />;
  }

  return (
    <PageEditorWorkspace
      initialData={pageData}
      onClose={() => setPageData(null)} // back to a fresh wizard
    />
  );
}