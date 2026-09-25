// frontend/src/api.ts
import type { Book, BookCreate } from './types.ts'

// In dev, leave this as "" if using the Vite proxy (see §6) —
// otherwise point at the backend directly.
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listBooks: (): Promise<Book[]> =>
    fetch(`${API_BASE}/books/`).then(handle<Book[]>),

  getBook: (id: number): Promise<Book> =>
    fetch(`${API_BASE}/books/${id}`).then(handle<Book>),

  createBook: (data: BookCreate): Promise<Book> =>
    fetch(`${API_BASE}/books/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle<Book>),

  deleteBook: (id: number): Promise<void> =>
    fetch(`${API_BASE}/books/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    }),

  uploadCover: (id: number, file: File): Promise<Book> => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/books/${id}/cover`, {
      method: "POST",
      body: form,   // do NOT set Content-Type — the browser sets the boundary
    }).then(handle<Book>);
  },
};

// Helper for <img src={...}>
export function coverUrl(path: string | null): string | null {
  if (!path) return null;
  return `${API_BASE}${path}`;   // "/media/covers/x.jpg" → full URL
}