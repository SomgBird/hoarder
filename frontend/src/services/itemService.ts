import type { Book, BookCreate, BookListItem, Page } from '../types';
import { request } from './client.ts'

export const itemService = {
  all: () => request<Book[]>("/books"),

  list: () => request<Page<BookListItem>>("/books/booklist"),

  get: (id: number) => request<Book>(`/books/${id}`),

  create: (data: BookCreate)  =>
    request("/books/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request(`/books/${id}`, { method: "DELETE" }),

  uploadCover: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/books/${id}/cover`, {
      method: "POST",
      body: form,   // do NOT set Content-Type — the browser sets the boundary
    });
  },
};