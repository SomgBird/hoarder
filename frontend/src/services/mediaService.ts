import type { MediaFileRead } from "../types/media.ts";
import { request } from "./client.ts";

export const mediaService = {
  list: (signal?: AbortSignal) => request<MediaFileRead[]>("/media/", { signal }),
};

export function describeMediaFile(file: MediaFileRead, fallbackName = file.name) {
  const photos = file.copy_photos ?? [];
  const name = photos.find((photo) => photo.name)?.name || fallbackName;
  const copies = photos.map((photo) =>
    [`Copy #${photo.copy_id}`, photo.name !== name && photo.name, photo.description].filter(Boolean).join(" · ")
  );
  return { name, copies };
}
