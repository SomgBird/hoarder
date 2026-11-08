import type { ItemCreate, ItemRead } from "../../../types/item.ts";
import { itemService } from "../../../services/itemService.ts";

/** Keep the created item available to the editor even if its cover fails. */
export async function saveNewItem(
  payload: ItemCreate,
  cover: File | null,
  createdItem: ItemRead | null,
  onCreated: (item: ItemRead) => void,
  onUploading: () => void,
): Promise<ItemRead> {
  const item = createdItem ?? await itemService.create(payload);
  if (!createdItem) onCreated(item);
  if (!cover) return item;
  onUploading();
  return itemService.uploadCover(item.id, cover);
}
