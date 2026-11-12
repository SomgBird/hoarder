import { useEffect, useState } from "react";
import { Button } from "@react95/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { itemService } from "@services";
import { ITEM_TYPES, type ItemRead } from "@types";
import { PageEditorWizard } from "./PageEditorWizard/PageEditorWizard";
import { PageEditorWorkspace } from "./PageEditorWorkspace/PageEditorWorkspace";
import type { PageData } from "./pageTypes";

export function PageEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemIdParam = searchParams.get("itemId");
  // null = still in the wizard, otherwise the wizard's result
  const [pageData, setPageData] = useState<PageData | null>(null);

  if (itemIdParam !== null) {
    const itemId = Number(itemIdParam);
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return <div style={{ padding: 24 }}>
        <p role="alert">Invalid item ID.</p>
        <Button onClick={() => navigate("/collection-view")}>Back to collection</Button>
      </div>;
    }
    return <ExistingPageEditor key={itemId} id={itemId}
      onClose={() => navigate(`/collection-view?itemId=${itemId}`)} />;
  }

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

function ExistingPageEditor({ id, onClose }: { id: number; onClose: () => void }) {
  const [item, setItem] = useState<ItemRead | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    itemService.get(id, controller.signal).then((loaded) => {
      if (controller.signal.aborted) return;
      if (!ITEM_TYPES.some((type) => type === loaded.item_type.name)) {
        throw new Error(`Unsupported item type: ${loaded.item_type.name}`);
      }
      setItem(loaded);
    }).catch((e) => {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load item.");
    });
    return () => controller.abort();
  }, [id, attempt]);

  if (item) return <PageEditorWorkspace existingItem={item} onClose={onClose} onSaved={onClose} />;

  return <div style={{ padding: 24 }}>
    {error ? <>
      <p role="alert">Could not load item. {error}</p>
      <Button onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</Button>
    </> : <p role="status">Loading item…</p>}
    <Button onClick={onClose}>Cancel</Button>
  </div>;
}
