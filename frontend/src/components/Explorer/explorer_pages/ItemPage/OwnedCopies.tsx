import { useState } from "react";
import { ConfirmDialog } from "@components/ConfirmDialog/ConfirmDialog";
import { itemService } from "@services";
import type { ItemRead, OwnedCopyRead } from "@types";
import { CopyEditor } from "./CopyEditor";
import styles from "./ItemView.module.css";

interface Props {
  item: ItemRead;
  onChanged: (item: ItemRead) => void;
}

export function OwnedCopies({ item, onChanged }: Props) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [target, setTarget] = useState<OwnedCopyRead | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const copies = item.owned_copies;
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

  return <section className={styles.section} aria-label="Owned copies">
    <h2>Owned copies</h2>
    <p>{copies.length
      ? `Owned through ${copies.length} recorded ${copies.length === 1 ? "copy" : "copies"}.`
      : `${item.is_owned ? "Owned" : "Not owned"}. No copies recorded.`}</p>
    {copies.map((copy) => <article key={copy.id} className={styles.copy} aria-label={`Copy #${copy.id}`}>
      <h3>Copy #{copy.id} · {copy.condition?.condition_type?.name ?? "Ungraded"}</h3>
      {editing === copy.id ? <CopyEditor itemId={item.id} copy={copy} onSaved={saved} onCancel={() => setEditing(null)} /> : <>
        {copy.condition?.notes && <p><strong>Condition notes</strong><br />{copy.condition.notes}</p>}
        {copy.notes && <p><strong>Copy notes</strong><br />{copy.notes}</p>}
        <div className={styles.copyActions}>
          <button type="button" disabled={locked} onClick={() => setEditing(copy.id)}>Edit copy</button>
          <button type="button" disabled={locked} onClick={() => { setError(""); setTarget(copy); }}>Remove copy</button>
        </div>
      </>}
    </article>)}
    {editing === "new"
      ? <CopyEditor itemId={item.id} onSaved={saved} onCancel={() => setEditing(null)} />
      : <button type="button" disabled={locked} onClick={() => setEditing("new")}>Add copy</button>}
    {target && <ConfirmDialog title="Remove copy" helpTopic="explorer"
      message={<>
        <p>Remove copy #{target.id} ({target.condition?.condition_type?.name ?? "Ungraded"}) from “{item.display_title}”?</p>
        {error && <p role="alert">{error}</p>}
      </>}
      busy={removing} confirmLabel={removing ? "Removing…" : "Remove copy"} dismissLabel="Cancel"
      onConfirm={remove} onDismiss={() => setTarget(null)} />}
  </section>;
}
