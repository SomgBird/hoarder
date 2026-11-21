import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@react95/core";
import { itemService, referenceService } from "@services";
import type { ConditionTypeRead, CopyWithPhotosWrite, ItemRead, OwnedCopyRead } from "@types";
import { CopyPhotos, type DraftPhoto } from "./CopyPhotos";
import styles from "./CopyEditor.module.css";

export type CopyEditState = "ready" | "dirty" | "busy";

interface Props {
  itemId: number;
  copy?: OwnedCopyRead;
  onSaved: (item: ItemRead) => void;
  onCancel: () => void;
  onEditState: (state: CopyEditState) => void;
}

export function CopyForm({ itemId, copy, onSaved, onCancel, onEditState }: Props) {
  const initial = {
    grade: String(copy?.condition?.condition_type?.id ?? ""),
    conditionNotes: copy?.condition?.notes ?? "",
    notes: copy?.notes ?? "",
  };
  const [draft, setDraft] = useState(initial);
  const [photos, setPhotos] = useState<DraftPhoto[]>(() => (copy?.photos ?? []).map((saved) => ({
    key: String(saved.id), saved, description: saved.description ?? "",
  })));
  const [requestId] = useState(() => crypto.randomUUID());
  const [grades, setGrades] = useState<ConditionTypeRead[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);

  function draftState(values: typeof draft, images: DraftPhoto[] = photos): CopyEditState {
    const samePhotos = images.length === (copy?.photos.length ?? 0)
      && images.every((photo) => photo.saved && photo.description === (photo.saved.description ?? ""));
    return samePhotos && values.grade === initial.grade && values.conditionNotes === initial.conditionNotes && values.notes === initial.notes
      ? "ready" : "dirty";
  }

  function change(field: keyof typeof draft, value: string) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    onEditState(draftState(next));
  }

  useEffect(() => {
    const controller = new AbortController();
    referenceService.conditionTypes(controller.signal).then((choices) => {
      if (!controller.signal.aborted) setGrades(choices);
    }).catch((error) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load condition grades.");
    });
    return () => controller.abort();
  }, [attempt]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !grades) return;
    setBusy(true);
    onEditState("busy");
    setSaveError("");
    const { grade, conditionNotes, notes } = draft;
    const data = { condition_type_id: grade ? Number(grade) : null, condition_notes: conditionNotes || null, notes: notes || null };
    try {
      const changes: NonNullable<CopyWithPhotosWrite["changes"]> = [];
      for (const saved of copy?.photos ?? []) {
        const edited = photos.find((photo) => photo.saved?.id === saved.id);
        if (!edited || edited.description !== (saved.description ?? "")) {
          changes.push({ id: saved.id, file_path: saved.file_path, remove: !edited, description: edited?.description || null });
        }
      }
      const uploads = photos.filter((photo) => photo.file !== undefined);
      let item: ItemRead;
      if (changes.length || uploads.length) {
        item = await itemService.saveCopyWithPhotos(itemId, {
          ...data, request_id: requestId, copy_id: copy?.id, changes,
          descriptions: uploads.map((photo) => photo.description || null),
        }, uploads.map((photo) => photo.file));
      } else if (copy) {
        item = await itemService.updateCopy(itemId, copy.id, data);
      } else {
        item = await itemService.addCopy(itemId, { ...data, request_id: requestId });
      }
      onSaved(item);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save copy.");
      setBusy(false);
      onEditState(draftState(draft));
    }
  }

  const title = copy ? `Edit copy #${copy.id}` : "Add copy";
  return <form onSubmit={save} className={styles.form} aria-label={title}>
    <h2>{title}</h2>
    <label>Condition grade
      <select autoFocus value={draft.grade} disabled={busy || !grades} onChange={(event) => change("grade", event.target.value)}>
        <option value="">Ungraded</option>
        {grades?.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
      </select>
    </label>
    {!grades && (loadError ? <div role="alert">{loadError} <Button type="button" onClick={() => {
      setLoadError(""); setAttempt((value) => value + 1);
    }}>Retry grades</Button></div> : <p role="status">Loading condition grades…</p>)}
    <label>Condition notes
      <textarea rows={2} value={draft.conditionNotes} disabled={busy} onChange={(event) => change("conditionNotes", event.target.value)} />
    </label>
    <label>Copy notes
      <textarea rows={2} value={draft.notes} disabled={busy} onChange={(event) => change("notes", event.target.value)} />
    </label>
    <CopyPhotos photos={photos} disabled={busy} onChange={(next) => {
      setPhotos(next);
      onEditState(draftState(draft, next));
    }} />
    {saveError && <p role="alert">{saveError}</p>}
    <div className={styles.actions}>
      <Button type="submit" disabled={busy || !grades}>{busy ? "Saving…" : "Save copy"}</Button>
      <Button type="button" disabled={busy} onClick={onCancel}>Cancel</Button>
    </div>
  </form>;
}
