import type { Book, BookCreate, BookListItem, Page } from '../types';
import { request } from './client.ts'

export const itemService = {
  allbooks: (): Promise<Book[]> => request<Book[]>("/books"),
  listbooks: (): Promise<Page<BookListItem>> => request<Page<BookListItem>>("/books/booklist"),
  getBook: (id: number): Promise<Book> => request<Book>(`/books/${id}`),
  createBook: (data: BookCreate): Promise<Book> =>
    request("/books/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteBook: (id: number): Promise<void> =>
    request(`/books/${id}`, { method: "DELETE" }),
  uploadCover: (id: number, file: File): Promise<Book> => {
    const form = new FormData();
    form.append("file", file);
    return request(`/books/${id}/cover`, {
      method: "POST",
      body: form,   // do NOT set Content-Type — the browser sets the boundary
    });
  },
};