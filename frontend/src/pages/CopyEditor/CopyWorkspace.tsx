import { useState } from "react";
import { Button, Frame } from "@react95/core";
import { ConfirmDialog } from "@components/ConfirmDialog/ConfirmDialog";
import { OwnedCopies } from "@components/OwnedCopies/OwnedCopies";
import { itemService } from "@services";
import type { ItemRead, OwnedCopyRead } from "@types";
import { CopyForm } from "./CopyForm";
import styles from "./CopyEditor.module.css";

interface Props {
  item: ItemRead;
  onChanged: (item: ItemRead) => void;
  onChooseItem: () => void;
  onViewItem: () => void;
}

export function CopyWorkspace({ item, onChanged, onChooseItem, onViewItem }: Props) {
  const [editing, setEditing] = useState<OwnedCopyRead | "new" | null>(null);
  const [target, setTarget] = useState<OwnedCopyRead | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const locked = editing !== null || target !== null;

  function saved(updated: ItemRead) {
    setEditing(null);
    onChanged(updated);
  }

  async function remove() {
    if (!target || removing) return;
    setRemoving(true);
    setError("");
    try {
      const updated = await itemService.removeCopy(item.id, target.id);
      setTarget(null);
      onChanged(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove copy.");
    } finally {
      setRemoving(false);
    }
  }

  return <>
    <div className={styles.toolbar}>
      <Button disabled={locked} onClick={() => setEditing("new")}>Add copy</Button>
      <Button disabled={locked} onClick={onChooseItem}>Choose another item</Button>
      <Button disabled={locked} onClick={onViewItem}>View in Explorer</Button>
    </div>
    <Frame className={styles.content} bgColor="$inputBackground" boxShadow="$in">
      <h1>{item.display_title}</h1>
      {editing ? <CopyForm itemId={item.id} copy={editing === "new" ? undefined : editing}
        onSaved={saved} onCancel={() => setEditing(null)} />
        : <OwnedCopies item={item} actions={(copy) => <div className={styles.actions}>
          <Button disabled={locked} onClick={() => setEditing(copy)}>Edit copy</Button>
          <Button disabled={locked} onClick={() => { setError(""); setTarget(copy); }}>Remove copy</Button>
        </div>} />}
    </Frame>
    {target && <ConfirmDialog title="Remove copy" helpTopic="copies"
      message={<>
        <p>Remove copy #{target.id} ({target.condition?.condition_type?.name ?? "Ungraded"}) from “{item.display_title}”?</p>
        {error && <p role="alert">{error}</p>}
      </>}
      busy={removing} confirmLabel={removing ? "Removing…" : "Remove copy"} dismissLabel="Cancel"
      onConfirm={remove} onDismiss={() => setTarget(null)} />}
  </>;
}
