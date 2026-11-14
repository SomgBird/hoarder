import type { ItemCreate, ItemRead, ItemUpdate } from "../../../types/item.ts";
import { itemService } from "../../../services/itemService.ts";

/** Remember successful steps so retries only save the remaining images. */
export async function saveNewItem(
  payload: ItemCreate,
  cover: File | null,
  createdItem: ItemRead | null,
  onCreated: (item: ItemRead) => void,
  onUploading: (kind: "cover" | "icon") => void,
  icon: File | null = null,
  onUploaded?: (kind: "cover" | "icon") => void,
  generateIconFromCover = false,
): Promise<ItemRead> {
  const item = createdItem ?? await itemService.create(payload);
  if (!createdItem) onCreated(item);
  return uploadImages(item, cover, icon, onCreated, onUploading, onUploaded, generateIconFromCover);
}

/** A retry after an image failure must not repeat the PATCH or recreate credits. */
export async function saveExistingItem(
  id: number,
  payload: ItemUpdate,
  cover: File | null,
  savedItem: ItemRead | null,
  onSaved: (item: ItemRead) => void,
  onUploading: (kind: "cover" | "icon") => void,
  icon: File | null = null,
  onUploaded?: (kind: "cover" | "icon") => void,
  generateIconFromCover = false,
): Promise<ItemRead> {
  const item = savedItem ?? await itemService.update(id, payload);
  if (!savedItem) onSaved(item);
  return uploadImages(item, cover, icon, onSaved, onUploading, onUploaded, generateIconFromCover);
}

async function uploadImages(
  savedItem: ItemRead,
  cover: File | null,
  icon: File | null,
  onSaved: (item: ItemRead) => void,
  onUploading: (kind: "cover" | "icon") => void,
  onUploaded?: (kind: "cover" | "icon") => void,
  generateIconFromCover = false,
): Promise<ItemRead> {
  let item = savedItem;
  for (const [kind, file] of [["cover", cover], ["icon", generateIconFromCover ? null : icon]] as const) {
    if (!file) continue;
    onUploading(kind);
    item = await (kind === "cover" ? itemService.uploadCover : itemService.uploadIcon)(item.id, file);
    onSaved(item);
    onUploaded?.(kind);
  }
  if (generateIconFromCover) {
    onUploading("icon");
    item = await itemService.generateIconFromCover(item.id);
    onSaved(item);
    onUploaded?.("icon");
  }
  return item;
}
