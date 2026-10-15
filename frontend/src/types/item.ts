// ---------- subtype details (discriminated on type_name) ----------
export interface BookDetails {
  type_name: "book";
  page_count: number | null;
}

export interface GameDetails {
  type_name: "game";
}

export type ItemDetails = BookDetails | GameDetails;
export type ItemType = ItemDetails["type_name"]; // "book" | "game"

// ---------- languages / titles ----------
export interface LanguageRead {
  id: number;
  code: string;
  name: string;
}

export interface TitleRead {
  id: number;
  title_text: string;
  short_text: string | null;
  language: LanguageRead | null;
}

export interface TitleCreate {
  title_text: string;
  short_text?: string | null;
  language_code: string;
}

// ---------- items ----------
// TODO: fill in from ItemBase (not shown). Guessing from the old Item type.
export interface ItemBase {
  release_date: string | null; // ISO date "1937-09-21"
  description: string | null;
  cover_image_path: string | null; // relative path to the cover image file
}

export interface ItemRead extends ItemBase {
  id: number;
  titles: TitleRead[];
  languages: LanguageRead[] | null;
}

export interface ItemCreate extends ItemBase {
  titles?: TitleCreate[];
  language_codes?: string[];
  selected_language_code?: string | null;
  details: ItemDetails;
}

export interface ItemListEntryRead {
  id: number;
  title: string;
  release_date: string; // non-null here, unlike ItemBase
  is_owned: boolean;
  icon_image_path: string | null;
}

// ---------- pagination ----------
export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}