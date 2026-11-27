import { Button, Fieldset, Input } from "@react95/core";
import { useRef, useState, type FormEvent } from "react";
import { articleService, type ArticleCreate, type ArticleRead, type ArticleUpdate } from "@services/articleService";
import { GalleryEntryList, type DraftImage } from "./GalleryEntryList";
import { ArticleImagePicker } from "./ArticleImagePicker";
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
  const savedGallery = existing?.blocks.find((block) => block.kind === "gallery")?.entries ?? [];
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(savedText);
  const [target, setTarget] = useState<LinkTarget | null>(savedLink ? { id: savedLink.item_id, title: savedLink.item_title } : null);
  const [gallery, setGallery] = useState<DraftImage[]>(() =>
    savedGallery.map((entry) => ({ ...entry, key: crypto.randomUUID() })),
  );
  const [picker, setPicker] = useState<"item" | "images" | null>(null);
  const addImages = useRef<HTMLButtonElement>(null);
  const [requestId] = useState(() => crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function closeImagePicker() {
    setPicker(null);
    addImages.current?.focus();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || picker) return;
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    const entries = gallery.map(({ path, caption }) => ({ path, caption }));
    try {
      if (existing) {
        const changes: ArticleUpdate = {};
        if (title.trim() !== initialTitle) changes.title = title.trim();
        if (text !== savedText) changes.text = text;
        if (target?.id !== savedLink?.item_id) changes.item_id = target?.id ?? null;
        if (entries.length !== savedGallery.length || entries.some(({ path, caption }, index) =>
          path !== savedGallery[index].path || caption !== savedGallery[index].caption
        )) changes.gallery = entries;
        if (Object.keys(changes).length) await articleService.update(existing.id, changes);
        onSaved(existing.id);
      } else {
        const blocks: ArticleCreate["blocks"] = [{ kind: "text", text }];
        if (target) blocks.push({ kind: "item-link", item_id: target.id });
        if (entries.length) blocks.push({ kind: "gallery", entries });
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
        {picker === "item" ? <ArticleItemPicker onChoose={(item) => { setTarget(item); setPicker(null); }}
          onCancel={() => setPicker(null)} /> : <div className={fields.inline_actions}>
          <Button type="button" disabled={picker === "images"}
            onClick={() => setPicker("item")}>{target ? "Change linked item…" : "Add item link…"}</Button>
          {target && <Button type="button" onClick={() => setTarget(null)}>Remove link</Button>}
        </div>}
      </Fieldset>
      <Fieldset legend="Gallery" className={styles.galleryFields} disabled={saving}>
        <Button type="button" ref={addImages} aria-expanded={picker === "images"} disabled={picker === "item"}
          onClick={() => setPicker(picker === "images" ? null : "images")}>Add images…</Button>
        {picker === "images" && <ArticleImagePicker onCancel={closeImagePicker} onChoose={(paths) => {
          const additions = paths.map((path) => ({ path, caption: "", key: crypto.randomUUID() }));
          setGallery((previous) => [...previous, ...additions]);
          closeImagePicker();
        }} />}
        <GalleryEntryList gallery={gallery} onChange={setGallery} />
      </Fieldset>
      {error && <p className={styles.message} role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={saving || picker !== null}>{saving ? "Saving…" : "Save article"}</Button>
        <Button type="button" disabled={saving} onClick={onClose}>Cancel</Button>
      </div>
    </form>
  </PageEditorWindow>;
}
