import { Button, Fieldset, Input } from "@react95/core";
import { useState, type FormEvent } from "react";
import { articleService } from "@services/articleService";
import { PageEditorWindow } from "./PageEditorWindow";
import styles from "./PageEditor.module.css";
import fields from "./PageEditorWorkspace/PageEditorWorkspace.module.css";

interface Props {
  initialTitle: string;
  onClose: () => void;
  onSaved: (id: number) => void;
}

export function ArticleEditor({ initialTitle, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const article = await articleService.create({
        request_id: requestId, title: title.trim(), blocks: [{ kind: "text", text }],
      });
      onSaved(article.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save article.");
      setSaving(false);
    }
  }

  return <PageEditorWindow onClose={onClose} busy={saving}>
    <form onSubmit={save}>
      <Fieldset legend="Article" className={styles.articleFields} disabled={saving}>
        <label htmlFor="article-title">Title</label>
        <Input id="article-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label htmlFor="article-text">Text</label>
        <textarea autoFocus id="article-text" className={fields.textarea} rows={12} value={text}
          onChange={(event) => setText(event.target.value)} />
      </Fieldset>
      {error && <p className={styles.message} role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save article"}</Button>
        <Button type="button" disabled={saving} onClick={onClose}>Cancel</Button>
      </div>
    </form>
  </PageEditorWindow>;
}
