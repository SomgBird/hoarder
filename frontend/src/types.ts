// frontend/src/types.ts
export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface Publisher {
  id: number;
  name: string;
  country: string | null;
}

export interface Author {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  release_date: string | null;   // ISO date string "1937-09-21"
  isbn: string | null;
  pages: number | null;
  description: string | null;
  cover_image_path: string | null;   // e.g. "/media/covers/abc.jpg"
  language: Language | null;
  publisher: Publisher | null;
  authors: Author[];
  created_at: string;
  updated_at: string;
}

// payload for POST /books/ — matches BookCreate in schemas.py
export interface BookCreate {
  title: string;
  release_date?: string;
  isbn?: string;
  pages?: number;
  description?: string;
  authors: string[];
  language_code?: string;
  language_name?: string;
  publisher_name?: string;
  language_id?: number;
  publisher_id?: number;
}