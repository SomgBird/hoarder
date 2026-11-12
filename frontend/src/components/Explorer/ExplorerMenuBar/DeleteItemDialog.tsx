import { useEffect, useRef, useState } from "react";
import { RecycleEmpty } from "@react95/icons";
import { ConfirmDialog } from "@components/ConfirmDialog/ConfirmDialog";
import { itemService } from "@services";
import type { ItemRead } from "@types";

interface Props {
  id: number;
  onDeleted: (id: number) => void;
  onDismiss: () => void;
}

export function DeleteItemDialog({ id, onDeleted, onDismiss }: Props) {
  const [item, setItem] = useState<ItemRead | null>(null);
  const [loadError, setLoadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const deleting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    itemService.get(id, controller.signal).then((loaded) => {
      if (!controller.signal.aborted) setItem(loaded);
    }).catch((error) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load item.");
    });
    return () => controller.abort();
  }, [id, attempt]);

  const confirm = async () => {
    if (!item || deleting.current) return;
    deleting.current = true;
    setBusy(true);
    setDeleteError("");
    try {
      await itemService.delete(item.id);
      onDeleted(item.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete item.");
      setBusy(false);
      deleting.current = false;
    }
  };

  return <ConfirmDialog
    title="Delete item"
    icon={<RecycleEmpty variant="32x32_4" />}
    confirmLabel={busy ? "Deleting…" : "Delete item"}
    dismissLabel="Cancel"
    busy={busy}
    confirmDisabled={!item}
    onConfirm={confirm}
    onDismiss={() => { if (!deleting.current) onDismiss(); }}
    message={<>
      {item ? <>
        <p>Permanently delete “{item.display_title}”?</p>
        <p>This deletes the item and its page from your collection. This cannot be undone.</p>
      </> : loadError ? <div role="alert">
        <p>Could not load item. {loadError}</p>
        <button type="button" onClick={() => { setLoadError(""); setAttempt((value) => value + 1); }}>Retry</button>
      </div> : <p role="status">Loading item…</p>}
      {busy && <p role="status">Deleting item…</p>}
      {deleteError && <p role="alert">Could not delete item. {deleteError}</p>}
    </>}
  />;
}
