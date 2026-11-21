import { useEffect, useState } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Files } from "@react95/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import CollectionManager from "@components/CollectionManager/CollectionManager";
import { ConfirmDialog } from "@components/ConfirmDialog/ConfirmDialog";
import { HelpButton } from "@components/HelpButton/HelpButton";
import { itemService } from "@services";
import type { ItemRead } from "@types";
import { CopyWorkspace } from "./CopyWorkspace";
import type { CopyEditState } from "./CopyForm";
import styles from "./CopyEditor.module.css";

export function CopyEditor() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const param = params.get("itemId");
  const id = Number(param);
  const routeItem = Number.isSafeInteger(id) && id > 0 ? id : null;
  const [revision, setRevision] = useState(0);
  // Keep the draft mounted if browser history requests a different item.
  const [guard, setGuard] = useState<{ id: number; state: "dirty" | "busy" } | null>(null);
  const activeId = guard?.id ?? routeItem;
  const [selection, setSelection] = useState({ open: activeId, selected: activeId });
  if (selection.open !== activeId) setSelection({ open: activeId, selected: activeId });
  const [requested, setRequested] = useState<number | null>(null);
  const historyChanged = routeItem !== activeId;
  const warning = guard?.state === "dirty" && (requested !== null || historyChanged);

  function openItem(itemId: number) {
    if (itemId === activeId || guard?.state === "busy" || warning) return;
    if (guard) setRequested(itemId);
    else setParams({ itemId: String(itemId) });
  }

  return <>
    <div className={styles.page} inert={warning}>
      <div inert={guard?.state === "busy"}>
        <CollectionManager selectedItemId={selection.selected} refreshKey={revision} openLabel="Open copies"
          onSelectItem={(selected) => setSelection({ open: activeId, selected })} onOpenItem={openItem} />
      </div>
      <Frame className={styles.window} bgColor="$material" boxShadow="$out" padding="$3">
        <TitleBar title="Copy Editor" icon={<Files variant="16x16_4" />}>
          <TitleBar.OptionsBox><HelpButton topic="copies" /></TitleBar.OptionsBox>
        </TitleBar>
        {activeId !== null
          ? <ItemCopies key={activeId} id={activeId} onSaved={() => setRevision((value) => value + 1)}
              onEditState={(state) => setGuard(state === "ready" ? null : { id: activeId, state })}
              onViewItem={() => navigate(`/collection-view?itemId=${activeId}`)} />
          : <Frame className={styles.content} bgColor="$inputBackground" boxShadow="$in">
              {param !== null && <p role="alert">Invalid item ID.</p>}
              <p>Open an item in Collection Manager to edit its copies.</p>
            </Frame>}
      </Frame>
    </div>
    {warning && <ConfirmDialog title="Unsaved copy changes" helpTopic="copies"
      message="Discard your unsaved copy changes before leaving this item?"
      confirmLabel="Discard changes" dismissLabel="Keep editing"
      onConfirm={() => {
        if (requested !== null) setParams({ itemId: String(requested) });
        setRequested(null);
        setGuard(null);
      }}
      onDismiss={() => {
        setRequested(null);
        setSelection({ open: activeId, selected: activeId });
        if (historyChanged) setParams({ itemId: String(activeId) }, { replace: true });
      }} />}
  </>;
}

function ItemCopies({ id, onEditState, onSaved, onViewItem }: {
  id: number; onEditState: (state: CopyEditState) => void; onSaved: () => void; onViewItem: () => void;
}) {
  const [item, setItem] = useState<ItemRead | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    itemService.get(id, controller.signal).then((loaded) => {
      if (!controller.signal.aborted) setItem(loaded);
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load item.");
    });
    return () => controller.abort();
  }, [id, attempt]);

  if (item) return <CopyWorkspace item={item} onChanged={(updated) => { setItem(updated); onSaved(); }}
    onEditState={onEditState} onViewItem={onViewItem} />;
  return <>
    {error ? <div role="alert"><p>{error}</p>
      <Button onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</Button>
    </div> : <p role="status">Loading item…</p>}
  </>;
}
