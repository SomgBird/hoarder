import { Button, Fieldset } from "@react95/core";
import { useState, type FormEvent } from "react";
import { franchisePageService, type FranchisePageRead } from "@services/franchisePageService";
import { PageEditorWindow } from "./PageEditorWindow";
import styles from "./PageEditor.module.css";
import fields from "./PageEditorWorkspace/PageEditorWorkspace.module.css";

export function FranchiseEditor({ franchise, onClose, onSaved }: {
  franchise: FranchisePageRead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [introduction, setIntroduction] = useState(franchise.introduction ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (introduction !== franchise.introduction) await franchisePageService.save(franchise.id, introduction);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save franchise page.");
      setSaving(false);
    }
  }

  return <PageEditorWindow editing={franchise.introduction !== null} onClose={onClose} busy={saving}>
    <form onSubmit={save}>
      <Fieldset legend={franchise.title} className={styles.articleFields} disabled={saving}>
        <label htmlFor="franchise-introduction">Introduction</label>
        <textarea id="franchise-introduction" className={fields.textarea} autoFocus rows={12} value={introduction}
          onChange={(event) => setIntroduction(event.target.value)} />
      </Fieldset>
      {error && <p className={styles.message} role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save franchise page"}</Button>
        <Button type="button" disabled={saving} onClick={onClose}>Cancel</Button>
      </div>
    </form>
  </PageEditorWindow>;
}
