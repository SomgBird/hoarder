import type { ItemRead, ItemCreate, ItemUpdate, ItemListPage, ItemOrdering, ItemFilters } from '../types/item.ts';
import type { ItemType } from '../types/itemTypes.ts';
import { request } from './client.ts'

const PATH = "/items";

export const itemService = {
  list: (offset = 0, limit = 20, signal?: AbortSignal, ordering?: ItemOrdering, itemType?: ItemType, query?: string, filters?: ItemFilters) => {
    const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    if (ordering) {
      params.set("sort_by", ordering.sortBy);
      params.set("sort_direction", ordering.direction);
    }
    if (itemType) params.set("item_type", itemType);
    if (query?.trim()) params.set("q", query.trim());
    for (const [key, value] of Object.entries(filters ?? {})) {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }
    return request<ItemListPage>(`${PATH}/itemlist?${params}`, { signal });
  },

  get: (id: number, signal?: AbortSignal) => request<ItemRead>(`${PATH}/${id}`, { signal }),

  create: (data: ItemCreate)  =>
    request<ItemRead>(`${PATH}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (id: number, data: ItemUpdate) =>
    request<ItemRead>(`${PATH}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`${PATH}/${id}`, { method: "DELETE" }),

  uploadCover: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ItemRead>(`${PATH}/${id}/cover`, {
      method: "POST",
      body: form,   // do NOT set Content-Type — the browser sets the boundary
    });
  },
  uploadIcon: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ItemRead>(`${PATH}/${id}/icon`, { method: "POST", body: form });
  },
  generateIconFromCover: (id: number) =>
    request<ItemRead>(`${PATH}/${id}/icon/from-cover`, { method: "POST" }),
};
