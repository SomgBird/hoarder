import { useState } from "react";
import { Wangimg128 } from "@react95/icons";
import { coverUrl } from "@services";
import type { MediaFileRead } from "@types";
import styles from "./MediaViewer.module.css";

interface Props {
  file: MediaFileRead;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export function MediaThumbnail({ file, selected, onSelect, onOpen }: Props) {
  const [error, setError] = useState(false);
  const photos = file.copy_photos ?? [];
  const name = photos[0]?.name || file.name;
  const label = photos.length ? [name, ...photos.map((photo) => `Copy #${photo.copy_id} ${photo.description ?? ""}`.trim())].join(" · ") : file.relative_path;
  return (
    <button type="button" className={styles.file} aria-current={selected} aria-label={label}
      aria-haspopup="dialog" title={label} onClick={onSelect}
      onDoubleClick={(event) => { event.currentTarget.focus(); onOpen(); }}
      onKeyDown={(event) => {
        if (event.key === "Enter") { event.preventDefault(); onOpen(); }
      }}>
      <span className={styles.thumbnail} aria-hidden="true">
        {error ? <Wangimg128 variant="32x32_4" width={64} height={64} />
          : <img src={coverUrl(file.path) ?? undefined} alt="" width={64} height={64} loading="lazy" onError={() => setError(true)} />}
      </span>
      <span className={styles.filename}>{name}</span>
      {photos.length ? photos.map((photo, index) => <span className={styles.filename} key={index}>
        Copy #{photo.copy_id}{photo.description && ` · ${photo.description}`}
      </span>) : <span className={styles.folder}>{file.relative_path.includes("/") ? file.relative_path.slice(0, file.relative_path.lastIndexOf("/")) : "media"}</span>}
    </button>
  );
}
