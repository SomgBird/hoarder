import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Fieldset } from "@react95/core";
import { Delete, Explorer100, FilePen, Files, New16, Warning } from "@react95/icons";
import { ConfirmDialog } from "@components/ConfirmDialog/ConfirmDialog";
import { ImageViewer } from "@components/ImageViewer/ImageViewer";
import { CopyPhotoList } from "@components/OwnedCopies/OwnedCopies";
import { Toolbar } from "@components/Toolbar";
import { copyPhotoUrl, itemService } from "@services";
import { ITEM_TYPE_OPTIONS, type CopyPhotoRead, type ItemRead, type OwnedCopyRead } from "@types";
import { CopyForm, type CopyEditState } from "./CopyForm";
import { CopyList } from "./CopyList";
import styles from "./CopyEditor.module.css";

interface Props {
  item: ItemRead | null;
  message?: ReactNode;
  onChanged: (item: ItemRead) => void;
  onEditState: (state: CopyEditState) => void;
  onViewItem: () => void;
}

export function CopyWorkspace({ item, message, onChanged, onEditState, onViewItem }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<OwnedCopyRead | "new" | null>(null);
  const [target, setTarget] = useState<OwnedCopyRead | null>(null);
  const [photo, setPhoto] = useState<CopyPhotoRead | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const copies = item?.owned_copies ?? [];
  const selected = copies.find((copy) => copy.id === selectedId) ?? copies[0];
  const type = ITEM_TYPE_OPTIONS.find((option) => option.value === item?.item_type.name)?.label ?? item?.item_type.name;
  const workspace = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  useLayoutEffect(() => {
    if (restoreFocus.current) {
      const row = workspace.current?.querySelector<HTMLButtonElement>('tbody button[aria-pressed="true"]');
      (row ?? workspace.current?.querySelector<HTMLButtonElement>("[data-add-copy]"))?.focus();
      restoreFocus.current = false;
    }
  }, [editing, target, selected?.id]);

  function closeForm() {
    restoreFocus.current = true;
    setEditing(null);
    onEditState("ready");
  }

  function saved(updated: ItemRead) {
    if (editing === "new") {
      const added = updated.owned_copies.find((entry) => !copies.some((copy) => copy.id === entry.id));
      if (added) setSelectedId(added.id);
    }
    closeForm();
    onChanged(updated);
  }

  async function remove() {
    if (!item || !target || removing) return;
    setRemoving(true);
    onEditState("busy");
    setError("");
    try {
      const updated = await itemService.removeCopy(item.id, target.id);
      restoreFocus.current = true;
      setTarget(null);
      onChanged(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove copy.");
    } finally {
      setRemoving(false);
      onEditState("ready");
    }
  }

  const ownership = copies.length ? `Owned through ${copies.length} recorded ${copies.length === 1 ? "copy" : "copies"}.`
    : item?.is_owned ? "Owned · 0 recorded copies" : "Not owned · 0 recorded copies";
  return <>
    <div ref={workspace} className={styles.workspace} inert={!!target || !!photo}>
      {!editing && <Toolbar className={styles.toolbar} aria-label="Copy commands">
        <Toolbar.Button data-add-copy="" icon={<New16 />} label="Add copy" disabled={!item} onClick={() => setEditing("new")} />
        <Toolbar.Button icon={<FilePen variant="16x16_4" />} label="Edit copy" disabled={!selected} onClick={() => selected && setEditing(selected)} />
        <Toolbar.Button icon={<Delete />} label="Remove copy" disabled={!selected} onClick={() => { setError(""); setTarget(selected ?? null); }} />
        <Toolbar.Separator />
        <Toolbar.Button icon={<Explorer100 variant="16x16_4" />} label="View in Explorer" disabled={!item} onClick={onViewItem} />
      </Toolbar>}
      <header className={styles.identity}>
        <Files variant="32x32_4" aria-hidden="true" />
        <div><h1 title={item?.display_title}>{item?.display_title ?? "Owned copies"}</h1>
          {item && <span>{type} · Item #{item.id}</span>}
        </div>
      </header>
      {editing && item ? <CopyForm itemId={item.id} copy={editing === "new" ? undefined : editing}
        onEditState={onEditState} onSaved={saved} onCancel={closeForm} /> : <>
        <CopyList copies={copies} selected={selected} onSelect={setSelectedId} onEdit={setEditing}
          emptyMessage={message ?? "No copies recorded. Choose Add copy to record the first one."} />
        {selected && <Fieldset key={selected.id} legend={`Copy #${selected.id} details`} className={styles.details} tabIndex={0}>
          <dl><dt>Condition notes</dt><dd>{selected.condition?.notes || "—"}</dd>
            <dt>Copy notes</dt><dd>{selected.notes || "—"}</dd></dl>
          <CopyPhotoList copy={selected} onOpen={setPhoto} />
        </Fieldset>}
      </>}
      <div role="status" className={styles.status}>
        <span>{editing === "new" ? "New copy" : editing ? `Editing copy #${editing.id}` : item ? "Ready" : "No item open"}</span>
        {item && <span>{ownership}</span>}
      </div>
    </div>
    {photo && <ImageViewer src={copyPhotoUrl(photo.file_path)} name={photo.name || `Photo #${photo.id}`}
      caption={photo.description} onClose={() => setPhoto(null)} />}
    {target && item && <ConfirmDialog title="Remove copy" helpTopic="copies" icon={<Warning variant="32x32_4" />}
      message={<>
        <p>Remove copy #{target.id} ({target.condition?.condition_type?.name ?? "Ungraded"}) from “{item.display_title}”?</p>
        {error && <p role="alert">{error}</p>}
      </>}
      busy={removing} confirmLabel={removing ? "Removing…" : "Remove copy"} dismissLabel="Cancel"
      onConfirm={remove} onDismiss={() => setTarget(null)} />}
  </>;
}
