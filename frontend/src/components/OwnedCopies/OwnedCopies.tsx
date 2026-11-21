import { useState, type ReactNode } from "react";
import { ImageViewer } from "@components/ImageViewer/ImageViewer";
import { copyPhotoUrl } from "@services";
import type { CopyPhotoRead, ItemRead, OwnedCopyRead } from "@types";
import styles from "./OwnedCopies.module.css";

interface Props {
  item: ItemRead;
  actions?: (copy: OwnedCopyRead) => ReactNode;
}

export function OwnedCopies({ item, actions }: Props) {
  const copies = item.owned_copies;
  const [open, setOpen] = useState<CopyPhotoRead | null>(null);
  return <><section aria-label="Owned copies" inert={open !== null}>
    <h2>Owned copies</h2>
    <p>{copies.length
      ? `Owned through ${copies.length} recorded ${copies.length === 1 ? "copy" : "copies"}.`
      : `${item.is_owned ? "Owned" : "Not owned"}. No copies recorded.`}</p>
    {copies.map((copy) => <article key={copy.id} className={styles.copy} aria-label={`Copy #${copy.id}`}>
      <h3>Copy #{copy.id} · {copy.condition?.condition_type?.name ?? "Ungraded"}</h3>
      {copy.condition?.notes && <p><strong>Condition notes</strong><br />{copy.condition.notes}</p>}
      {copy.notes && <p><strong>Copy notes</strong><br />{copy.notes}</p>}
      <CopyPhotoList copy={copy} onOpen={setOpen} />
      {actions?.(copy)}
    </article>)}
  </section>
    {open && <ImageViewer src={copyPhotoUrl(open.file_path)} name={open.name || `Photo #${open.id}`}
      caption={open.description} onClose={() => setOpen(null)} />}
  </>;
}

export function CopyPhotoList({ copy, onOpen }: { copy: OwnedCopyRead; onOpen: (photo: CopyPhotoRead) => void }) {
  if (!copy.photos.length) return null;
  return <ul className={styles.photos} aria-label={`Photos of copy #${copy.id}`}>
    {copy.photos.map((photo) => <li key={photo.id}>
      <button type="button" onClick={() => onOpen(photo)} aria-label={`Open ${photo.name || "photo #" + photo.id}`}>
        <img src={copyPhotoUrl(photo.file_path)} alt="" width={80} height={80} loading="lazy" />
      </button>
      <span>{photo.description || photo.name || `Photo #${photo.id}`}</span>
    </li>)}
  </ul>;
}
