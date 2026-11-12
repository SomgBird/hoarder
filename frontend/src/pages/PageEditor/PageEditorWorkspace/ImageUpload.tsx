import { useEffect, useRef, useState } from "react";
import { coverUrl } from "@services";
import styles from "./PageEditorWorkspace.module.css";

interface Props {
  label: string;
  file: File | null;
  savedPath: string | null;
  error: string;
  onSelect: (file: File | null, error: string) => void;
}

export function ImageUpload({ label, file, savedPath, error, onSelect }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    if (!file) {
      if (input.current) input.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview({ file, url: String(reader.result) });
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  const url = file ? preview?.file === file ? preview.url : null : coverUrl(savedPath);

  return <div className={styles.image_upload}>
    {url && <img className={styles.image_preview} src={url} alt={`${label} preview`} />}
    <label>
      Upload {label.toLowerCase()}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        const selected = event.target.files?.[0] ?? null;
        const invalid = selected && (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)
          || selected.size > 5 * 1024 * 1024);
        onSelect(invalid ? null : selected, invalid ? "Choose a JPEG, PNG or WebP image no larger than 5 MB." : "");
        if (invalid) event.target.value = "";
      }} />
    </label>
    <small>JPEG, PNG or WebP, up to 5 MB.</small>
    {(file || error) && <button type="button" className={styles.link_button} onClick={() => onSelect(null, "")}>Clear selection</button>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
