import type { Book, BookCreate, BookListItem, Page } from '../types';
import { request } from './client.ts'

const PATH = "/books";

export const itemService = {
  all: () => request<Book[]>(`${PATH}`),

  list: () => request<Page<BookListItem>>(`${PATH}/booklist`),

  get: (id: number) => request<Book>(`${PATH}/${id}`),

  create: (data: BookCreate)  =>
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