import { FileIcons, Wangimg128 } from "@react95/icons";
import { Button } from "@react95/core";
import { useEffect, useRef, useState } from "react";
import { coverUrl } from "@services";
import { imageRequirements, imageTypes, isValidImageFile } from "@services/imageUpload";
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

  const Placeholder = label === "Icon" ? FileIcons : Wangimg128;
  return <div className={styles.image_upload}>
    <div className={styles.preview}>
      {url ? <img className={styles.image_preview} src={url} alt={`${label} preview`} />
        : <><Placeholder variant="32x32_4" aria-hidden="true" /><small>{file ? file.name : `No ${label.toLowerCase()} selected`}</small></>}
    </div>
    <label>
      Upload {label.toLowerCase()}
      <input ref={input} type="file" accept={imageTypes.join(",")} onChange={(event) => {
        const selected = event.target.files?.[0] ?? null;
        const invalid = selected && !isValidImageFile(selected);
        onSelect(invalid ? null : selected, invalid ? "Choose a JPEG, PNG or WebP image no larger than 5 MB." : "");
        if (invalid) event.target.value = "";
      }} />
    </label>
    <small>{imageRequirements}</small>
    {(file || error) && <Button type="button" className={styles.button} onClick={() => onSelect(null, "")}>Clear selection</Button>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
