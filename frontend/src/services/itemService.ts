import type { Book, BookCreate, BookListItem, Page } from '../types';
import { request } from './client.ts'

export const itemService = {
  allbooks: () => request<Book[]>("/books"),

  listbooks: () => request<Page<BookListItem>>("/books/booklist"),

  getBook: (id: number) => request<Book>(`/books/${id}`),

  createBook: (data: BookCreate)  =>
    request("/books/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteBook: (id: number) =>
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