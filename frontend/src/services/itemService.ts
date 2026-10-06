import type { Item, ItemCreate, ItemInfo, Page } from '../types/item.ts';
import { request } from './client.ts'

const PATH = "/books";

export const itemService = {
  all: () => request<Item[]>(`${PATH}`),

  list: () => request<Page<ItemInfo>>(`${PATH}/booklist`),

  get: (id: number) => request<Item>(`${PATH}/${id}`),

  create: (data: ItemCreate)  =>
    request(`${PATH}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request(`${PATH}/${id}`, { method: "DELETE" }),

  uploadCover: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request(`${PATH}/${id}/cover`, {
      method: "POST",
      body: form,   // do NOT set Content-Type — the browser sets the boundary
    });
  },
};