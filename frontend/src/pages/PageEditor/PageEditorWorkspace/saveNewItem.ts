import type { ItemCreate, ItemRead } from "../../../types/item.ts";
import { itemService } from "../../../services/itemService.ts";

/** Remember each successful step so retries only upload the remaining images. */
export async function saveNewItem(
  payload: ItemCreate,
  cover: File | null,
  createdItem: ItemRead | null,
  onCreated: (item: ItemRead) => void,
  onUploading: (kind: "cover" | "icon") => void,
  icon: File | null = null,
  onUploaded?: (kind: "cover" | "icon") => void,
): Promise<ItemRead> {
  let item = createdItem ?? await itemService.create(payload);
  if (!createdItem) onCreated(item);
  for (const [kind, file] of [["cover", cover], ["icon", icon]] as const) {
    if (!file) continue;
    onUploading(kind);
    item = await (kind === "cover" ? itemService.uploadCover : itemService.uploadIcon)(item.id, file);
    onCreated(item);
    onUploaded?.(kind);
  }
  return item;
}
