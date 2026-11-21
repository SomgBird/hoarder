import { useEffect, useRef, useState } from "react";
import { Button, Fieldset, Input } from "@react95/core";
import { copyPhotoUrl } from "@services";
import { imageRequirements, imageTypes, isValidImageFile } from "@services/imageUpload";
import type { CopyPhotoRead } from "@types";
import styles from "./CopyEditor.module.css";

export type DraftPhoto = { key: string; description: string } & (
  { saved: CopyPhotoRead; file?: never } | { file: File; saved?: never }
);

function PhotoPreview({ photo, name }: { photo: DraftPhoto; name: string }) {
  const image = useRef<HTMLImageElement>(null);
  const file = photo.file;
  useEffect(() => {
    if (!file || !image.current) return;
    const url = URL.createObjectURL(file);
    image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={image} alt={`Preview of ${name}`} width={80} height={80}
    src={photo.saved ? copyPhotoUrl(photo.saved.file_path) : undefined} />;
}

export function CopyPhotos({ photos, disabled, onChange }: {
  photos: DraftPhoto[]; disabled: boolean; onChange: (photos: DraftPhoto[]) => void;
}) {
  const [error, setError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  return <Fieldset legend="Attached photos" disabled={disabled} className={styles.group}>
    <div className={styles.photoTools}>
      <Button type="button" onClick={() => picker.current?.click()}>Add photos…</Button>
      <span>{imageRequirements}</span>
      <input ref={picker} aria-label="Add photos" hidden type="file" multiple accept={imageTypes.join(",")} onChange={(event) => {
        const selected = Array.from(event.target.files ?? []);
        const valid = selected.filter(isValidImageFile);
        const skipped = selected.filter((file) => !isValidImageFile(file));
        setError(skipped.length ? `Could not add ${skipped.map((file) => file.name).join(", ")}. ${imageRequirements}` : "");
        onChange([...photos, ...valid.map((file) => ({ key: crypto.randomUUID(), file, description: "" }))]);
        event.target.value = "";
      }} />
    </div>
    {error && <p role="alert">{error}</p>}
    {!photos.length && <p className={styles.noPhotos}>No photos attached.</p>}
    {photos.map((photo) => {
      const name = photo.file?.name || photo.saved?.name || `Photo #${photo.saved?.id}`;
      return <div key={photo.key} role="group" aria-label={name} className={styles.photo}>
        <PhotoPreview photo={photo} name={name} />
        <div>
          <strong>{name}</strong>
          <label>Description
            <Input type="text" maxLength={240} value={photo.description} onChange={(event) => {
              onChange(photos.map((entry) => entry.key === photo.key ? { ...entry, description: event.target.value } : entry));
            }} />
          </label>
          <Button type="button" aria-label={`Remove ${name}`} onClick={() => onChange(photos.filter((entry) => entry.key !== photo.key))}>Remove photo</Button>
        </div>
      </div>;
    })}
  </Fieldset>;
}
