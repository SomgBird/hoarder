import { Button, Input } from "@react95/core";
import { useEffect, useState } from "react";
import { coverUrl, mediaService } from "@services";
import type { MediaFileRead } from "@types";
import styles from "./PageEditor.module.css";
import fields from "./PageEditorWorkspace/PageEditorWorkspace.module.css";

type Result = { files: MediaFileRead[]; error?: never } | { error: string; files?: never };

function imageLabel(file: MediaFileRead) {
  const photos = file.copy_photos ?? [];
  return [
    photos.find((photo) => photo.name)?.name || file.name,
    photos.length
      ? photos.map((photo) => [`Copy #${photo.copy_id}`, photo.description].filter(Boolean).join(" · ")).join(" / ")
      : file.relative_path,
  ];
}

export function ArticleImagePicker({ onChoose, onCancel }: {
  onChoose: (paths: string[]) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>();

  useEffect(() => {
    const controller = new AbortController();
    mediaService.list(controller.signal).then((files) => {
      if (!controller.signal.aborted) setResult({ files });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setResult({ error: error instanceof Error ? error.message : "Could not load collection images." });
      }
    });
    return () => controller.abort();
  }, [attempt]);

  function select(path: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(path);
      else next.delete(path);
      return next;
    });
  }

  const filter = query.trim().toLocaleLowerCase();
  const matches = result?.files?.map((file) => ({ file, label: imageLabel(file) })).filter(({ file, label }) =>
    [file.relative_path, ...label].join(" ").toLocaleLowerCase().includes(filter),
  );

  return <div className={styles.imagePicker}>
    <label className={styles.galleryLabel} htmlFor="article-image-search">Find collection images</label>
    <Input id="article-image-search" autoFocus className={styles.galleryInput} value={query}
      onChange={(event) => setQuery(event.target.value)} />
    {!result && <p role="status">Loading collection images…</p>}
    {result?.error && <p role="alert">{result.error} <Button type="button"
      onClick={() => { setResult(undefined); setAttempt((value) => value + 1); }}>Retry</Button></p>}
    {matches?.length === 0 && <p role="status">{filter ? "No matching images." : "No collection images yet."}</p>}
    {matches && matches.length > 0 && <ul aria-label="Collection images" className={styles.imageResults}>
      {matches.map(({ file, label: [name, details] }) => <li key={file.path}>
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
