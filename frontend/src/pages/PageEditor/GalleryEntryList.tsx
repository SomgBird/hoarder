import { Button } from "@react95/core";
import type { GalleryEntry } from "@services/articleService";
import { coverUrl } from "@services/utils";
import styles from "./PageEditor.module.css";
import fields from "./PageEditorWorkspace/PageEditorWorkspace.module.css";

export type DraftImage = GalleryEntry & { key: string };

export function GalleryEntryList({ gallery, onChange }: {
  gallery: DraftImage[];
  onChange: (entries: DraftImage[]) => void;
}) {
  function moveImage(index: number, delta: number) {
    const reordered = [...gallery];
    [reordered[index], reordered[index + delta]] = [reordered[index + delta], reordered[index]];
    onChange(reordered);
  }

  if (!gallery.length) return null;
  return <ol aria-label="Gallery images" className={styles.galleryEntries}>
    {gallery.map(({ key, path, caption }, index) => <li key={key} className={styles.galleryEntry}>
      <img src={coverUrl(path) ?? undefined} alt={`Gallery image ${index + 1}`} width={64} height={60} loading="lazy" />
      <div>
        <label className={styles.galleryLabel} htmlFor={key}>Caption</label>
        <textarea id={key} aria-label={`Caption for image ${index + 1}`}
          className={`${fields.textarea} ${styles.captionInput}`} rows={2} value={caption}
          onChange={(event) => onChange(gallery.map((entry) =>
            entry.key === key ? { ...entry, caption: event.target.value } : entry
          ))} />
        <div className={fields.inline_actions}>
          <Button type="button" aria-label={`Move image ${index + 1} up`} disabled={index === 0}
            onClick={() => moveImage(index, -1)}>Move up</Button>
          <Button type="button" aria-label={`Move image ${index + 1} down`} disabled={index === gallery.length - 1}
            onClick={() => moveImage(index, 1)}>Move down</Button>
          <Button type="button" aria-label={`Remove image ${index + 1}`}
            onClick={() => onChange(gallery.filter((entry) => entry.key !== key))}>Remove</Button>
        </div>
      </div>
    </li>)}
  </ol>;
}
