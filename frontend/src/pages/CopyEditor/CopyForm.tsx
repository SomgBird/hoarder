import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@react95/core";
import { itemService, referenceService } from "@services";
import type { ConditionTypeRead, ItemRead, OwnedCopyRead } from "@types";
import styles from "./CopyEditor.module.css";

interface Props {
  itemId: number;
  copy?: OwnedCopyRead;
  onSaved: (item: ItemRead) => void;
  onCancel: () => void;
}

export function CopyForm({ itemId, copy, onSaved, onCancel }: Props) {
  const [grade, setGrade] = useState(String(copy?.condition?.condition_type?.id ?? ""));
  const [conditionNotes, setConditionNotes] = useState(copy?.condition?.notes ?? "");
  const [notes, setNotes] = useState(copy?.notes ?? "");
  const [requestId] = useState(() => crypto.randomUUID());
  const [grades, setGrades] = useState<ConditionTypeRead[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);

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
    setSaveError("");
    const data = { condition_type_id: grade ? Number(grade) : null, condition_notes: conditionNotes || null, notes: notes || null };
    try {
      const item = copy
        ? await itemService.updateCopy(itemId, copy.id, data)
        : await itemService.addCopy(itemId, { ...data, request_id: requestId });
      onSaved(item);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save copy.");
      setBusy(false);
    }
  }

  const title = copy ? `Edit copy #${copy.id}` : "Add copy";
  return <form onSubmit={save} className={styles.form} aria-label={title}>
    <h2>{title}</h2>
    <label>Condition grade
      <select autoFocus value={grade} disabled={busy || !grades} onChange={(event) => setGrade(event.target.value)}>
        <option value="">Ungraded</option>
        {grades?.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
      </select>
    </label>
    {!grades && (loadError ? <div role="alert">{loadError} <Button type="button" onClick={() => {
      setLoadError(""); setAttempt((value) => value + 1);
    }}>Retry grades</Button></div> : <p role="status">Loading condition grades…</p>)}
    <label>Condition notes
      <textarea rows={2} value={conditionNotes} disabled={busy} onChange={(event) => setConditionNotes(event.target.value)} />
    </label>
    <label>Copy notes
      <textarea rows={2} value={notes} disabled={busy} onChange={(event) => setNotes(event.target.value)} />
    </label>
    {saveError && <p role="alert">{saveError}</p>}
    <div className={styles.actions}>
      <Button type="submit" disabled={busy || !grades}>{busy ? "Saving…" : "Save copy"}</Button>
      <Button type="button" disabled={busy} onClick={onCancel}>Cancel</Button>
    </div>
  </form>;
}
