import { Button, Input } from "@react95/core";
import { useState } from "react";
import { useMediaFiles } from "../../hooks/useMediaFiles";
import { describeMediaFile } from "@services/mediaService";
import { coverUrl } from "@services/utils";
import styles from "./PageEditor.module.css";
import fields from "./PageEditorWorkspace/PageEditorWorkspace.module.css";

export function ArticleImagePicker({ onChoose, onCancel }: {
  onChoose: (paths: string[]) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const { result, refresh } = useMediaFiles();

  function select(path: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(path);
      else next.delete(path);
      return next;
    });
  }

  const filter = query.trim().toLocaleLowerCase();
  const matches = result?.files?.map((file) => {
    const { name, copies } = describeMediaFile(file);
    return { file, name, details: copies.length ? copies.join(" / ") : file.relative_path };
  }).filter(({ file, name, details }) => [file.relative_path, name, details].join(" ").toLocaleLowerCase().includes(filter));

  return <div className={styles.imagePicker}>
    <label className={styles.galleryLabel} htmlFor="article-image-search">Find collection images</label>
    <Input id="article-image-search" autoFocus className={styles.galleryInput} value={query}
      onChange={(event) => setQuery(event.target.value)} />
    {!result && <p role="status">Loading collection images…</p>}
    {result?.error && <p role="alert">{result.error} <Button type="button" onClick={refresh}>Retry</Button></p>}
    {matches?.length === 0 && <p role="status">{filter ? "No matching images." : "No collection images yet."}</p>}
    {matches && matches.length > 0 && <ul aria-label="Collection images" className={styles.imageResults}>
      {matches.map(({ file, name, details }) => <li key={file.path}>
        <label className={styles.imageResult}>
          <input type="checkbox" checked={selected.has(file.path)} aria-label={`${name} · ${details}`}
            onChange={(event) => select(file.path, event.currentTarget.checked)} />
          <img src={coverUrl(file.path) ?? undefined} alt="" width={48} height={40} loading="lazy" />
          <span>{name}{details !== name && <small>{details}</small>}</span>
        </label>
      </li>)}
    </ul>}
    <div className={fields.inline_actions}>
      <Button type="button" disabled={!selected.size} onClick={() => onChoose([...selected])}>Add selected</Button>
      <Button type="button" onClick={onCancel}>Cancel selection</Button>
    </div>
  </div>;
}
