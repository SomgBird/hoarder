import { useEffect, useState } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Files, Warning } from "@react95/icons";
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
  const [requested, setRequested] = useState<number | "close" | null>(null);
  const historyChanged = routeItem !== activeId;
  const warning = guard?.state === "dirty" && (requested !== null || historyChanged);

  function openItem(itemId: number) {
    if (itemId === activeId || guard?.state === "busy" || warning) return;
    if (guard) setRequested(itemId);
    else setParams({ itemId: String(itemId) });
  }

  function viewInExplorer() {
    navigate(activeId === null ? "/collection-view" : `/collection-view?itemId=${activeId}`);
  }

  function closeEditor() {
    if (guard?.state === "dirty") setRequested("close");
    else if (!guard) viewInExplorer();
  }

  return <>
    <div className={styles.page} inert={warning}>
      <div className={styles.manager} inert={guard?.state === "busy"}>
        <CollectionManager selectedItemId={selection.selected} refreshKey={revision} openLabel="Open copies"
          onSelectItem={(selected) => setSelection({ open: activeId, selected })} onOpenItem={openItem} />
      </div>
      <Frame role="region" aria-label="Copy Editor" className={styles.window} bgColor="$material" boxShadow="$out" padding="$3">
        <TitleBar className={styles.caption} title="Copy Editor" icon={<Files variant="16x16_4" />}>
          <TitleBar.OptionsBox>
            <HelpButton topic="copies" />
            <TitleBar.Close type="button" aria-label="Close Copy Editor" disabled={guard?.state === "busy"} onClick={closeEditor} />
          </TitleBar.OptionsBox>
        </TitleBar>
        <ItemCopies key={activeId} id={activeId} invalid={activeId === null && param !== null}
          onSaved={() => setRevision((value) => value + 1)}
          onEditState={(state) => setGuard(state === "ready" || activeId === null ? null : { id: activeId, state })}
          onViewItem={viewInExplorer} />
      </Frame>
    </div>
    {warning && <ConfirmDialog title="Unsaved copy changes" helpTopic="copies" icon={<Warning variant="32x32_4" />}
      message="Discard your unsaved copy changes before leaving this item?"
      confirmLabel="Discard changes" dismissLabel="Keep editing"
      onConfirm={() => {
        if (requested === "close") viewInExplorer();
        else if (requested !== null) setParams({ itemId: String(requested) });
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

function ItemCopies({ id, invalid, onEditState, onSaved, onViewItem }: {
  id: number | null; invalid: boolean; onEditState: (state: CopyEditState) => void; onSaved: () => void; onViewItem: () => void;
}) {
  const [item, setItem] = useState<ItemRead | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    itemService.get(id, controller.signal).then((loaded) => {
      if (!controller.signal.aborted) setItem(loaded);
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load item.");
    });
    return () => controller.abort();
  }, [id, attempt]);

  const message = id === null ? <>
    {invalid && <p role="alert">Invalid item ID.</p>}
    Open an item in Collection Manager to edit its copies.
  </> : error ? <div role="alert"><p>{error}</p>
    <Button onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</Button>
  </div> : !item ? <span role="status">Loading item…</span> : undefined;

  return <CopyWorkspace item={item} message={message} onChanged={(updated) => { setItem(updated); onSaved(); }}
    onEditState={onEditState} onViewItem={onViewItem} />;
}
