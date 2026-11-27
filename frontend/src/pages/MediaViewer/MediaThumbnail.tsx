import { useState } from "react";
import { Wangimg128 } from "@react95/icons";
import { coverUrl } from "@services";
import { describeMediaFile } from "@services/mediaService";
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
  const { name, copies } = describeMediaFile(file);
  const label = copies.length ? [name, ...copies].join(" · ") : file.relative_path;
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
      {copies.length ? copies.map((description, index) => <span className={styles.filename} key={index}>
        {description}
      </span>) : <span className={styles.folder}>{file.relative_path.includes("/") ? file.relative_path.slice(0, file.relative_path.lastIndexOf("/")) : "media"}</span>}
    </button>
  );
}
