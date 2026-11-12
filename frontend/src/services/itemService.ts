import type { ItemRead, ItemCreate, ItemUpdate, ItemListPage } from '../types/item.ts';
import { request } from './client.ts'

const PATH = "/items";

export const itemService = {
  list: (offset = 0, limit = 20, signal?: AbortSignal) =>
    request<ItemListPage>(`${PATH}/itemlist?offset=${offset}&limit=${limit}`, { signal }),

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
