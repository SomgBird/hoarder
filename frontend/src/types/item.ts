// Mirrors backend app/db/schemas.py. Dates are ISO strings ("1937-09-21").
//
// Read types: every field is present in the JSON, so nullable fields are `T | null`.
// Create/update types: fields the backend defaults are optional (`?`).
// Create and update payloads are strict: the backend rejects unknown keys with a 422,
// so build them field by field instead of spreading an ItemRead into one.

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


export interface ItemTypeRead {
  id: number;
  name: ItemType;
  description: string | null;
}

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

// ---------- author credits ----------
export interface AuthorRead {
  id: number;
  name: string;
}

export interface AuthorRoleRead {
  id: number;
  name: string;
}

export interface AuthorCreditRead {
  author: AuthorRead;
  role: AuthorRoleRead;
  involvement_date: string | null;
  comments: string | null;
}

// Backend requires exactly one of author_id / author_name; the union enforces it at compile time.
type AuthorRef =
  | { author_id: number; author_name?: never } // existing author, picked from autocomplete
  | { author_name: string; author_id?: never }; // new author, matched or created by name

export type AuthorCreditCreate = AuthorRef & {
  role_name: string;
  involvement_date?: string | null;
  comments?: string | null;
};

// ---------- company credits ----------
export interface CompanyRead {
  id: number;
  name: string;
}

export interface CompanyRoleRead {
  id: number;
  name: string;
}

export interface CompanyCreditRead {
  company: CompanyRead;
  role: CompanyRoleRead;
  involvement_date: string | null;
  comments: string | null;
}

type CompanyRef =
  | { company_id: number; company_name?: never }
  | { company_name: string; company_id?: never };

export type CompanyCreditCreate = CompanyRef & {
  role_name: string;
  involvement_date?: string | null;
  comments?: string | null;
};

// ---------- items ----------
// Mirrors backend ItemBase. (Item.description exists in the DB but not in ItemBase yet.)
export interface ItemBase {
  release_date: string | null;
  cover_image_path: string | null; // relative path to the cover image file
  icon_image_path: string | null;
  is_owned: boolean | null;
  description: string | null;
}

export interface ItemRead extends ItemBase {
  id: number;
  titles: TitleRead[];
  languages: LanguageRead[];
  selected_language: LanguageRead;
  item_type: ItemTypeRead;
  author_credits: AuthorCreditRead[];
  company_credits: CompanyCreditRead[];
  details: ItemDetails;
}

export interface ItemCreate extends Partial<ItemBase> {
  titles?: TitleCreate[];
  language_codes?: string[];
  selected_language_code?: string | null;
  author_credits?: AuthorCreditCreate[];
  company_credits?: CompanyCreditCreate[];
  details: ItemDetails;
}

// PATCH payload. Omit a key to leave it unchanged.
//   - scalar fields: null clears the value
//   - list fields: an array replaces the whole collection ([] clears it); don't send null
export interface ItemUpdate extends Partial<ItemBase> {
  selected_language_code?: string | null;
  language_codes?: string[];
  titles?: TitleCreate[];
  author_credits?: AuthorCreditCreate[];
  company_credits?: CompanyCreditCreate[];
}

export interface ItemListEntryRead {
  id: number;
  title: string;
  release_date: string | null;
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