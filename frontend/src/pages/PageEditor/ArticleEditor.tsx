import { Button, Fieldset, Input } from "@react95/core";
import { useState, type FormEvent } from "react";
import { articleService, type ArticleCreate, type ArticleRead, type ArticleUpdate } from "@services/articleService";
import { ArticleItemPicker, type LinkTarget } from "./ArticleItemPicker";
import { PageEditorWindow } from "./PageEditorWindow";
import styles from "./PageEditor.module.css";
import fields from "./PageEditorWorkspace/PageEditorWorkspace.module.css";

interface Props {
  initialTitle: string;
  existing?: ArticleRead;
  onClose: () => void;
  onSaved: (id: number) => void;
}

export function ArticleEditor({ initialTitle, existing, onClose, onSaved }: Props) {
  const savedText = existing?.blocks.find((block) => block.kind === "text")?.text ?? "";
  const savedLink = existing?.blocks.find((block) => block.kind === "item-link");
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(savedText);
  const [target, setTarget] = useState<LinkTarget | null>(savedLink ? { id: savedLink.item_id, title: savedLink.item_title } : null);
  const [choosing, setChoosing] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || choosing) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (existing) {
        const changes: ArticleUpdate = {};
        if (title.trim() !== initialTitle) changes.title = title.trim();
        if (text !== savedText) changes.text = text;
        if (target?.id !== savedLink?.item_id) changes.item_id = target?.id ?? null;
        if (Object.keys(changes).length) await articleService.update(existing.id, changes);
        onSaved(existing.id);
      } else {
        const blocks: ArticleCreate["blocks"] = [{ kind: "text", text }];
        if (target) blocks.push({ kind: "item-link", item_id: target.id });
        const article = await articleService.create({ request_id: requestId, title: title.trim(), blocks });
        onSaved(article.id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save article.");
      setSaving(false);
    }
  }

  return <PageEditorWindow editing={!!existing} onClose={onClose} busy={saving}>
    <form onSubmit={save}>
      <Fieldset legend="Article" className={styles.articleFields} disabled={saving}>
        <label htmlFor="article-title">Title</label>
        <Input id="article-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label htmlFor="article-text">Text</label>
        <textarea autoFocus id="article-text" className={fields.textarea} rows={12} value={text}
          onChange={(event) => setText(event.target.value)} />
        {target && <p>Linked item: {target.title ?? "Unavailable item"} (#{target.id})</p>}
        {choosing ? <ArticleItemPicker onChoose={(item) => { setTarget(item); setChoosing(false); }}
          onCancel={() => setChoosing(false)} /> : <div className={fields.inline_actions}>
          <Button type="button" onClick={() => setChoosing(true)}>{target ? "Change linked item…" : "Add item link…"}</Button>
          {target && <Button type="button" onClick={() => setTarget(null)}>Remove link</Button>}
        </div>}
      </Fieldset>
      {error && <p className={styles.message} role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={saving || choosing}>{saving ? "Saving…" : "Save article"}</Button>
        <Button type="button" disabled={saving} onClick={onClose}>Cancel</Button>
      </div>
    </form>
  </PageEditorWindow>;
}
