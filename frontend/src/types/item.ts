// Mirrors backend app/db/schemas.py. Dates are ISO strings ("1937-09-21").
//
// Read types: every field is present in the JSON, so nullable fields are `T | null`.
// Create/update types: fields the backend defaults are optional (`?`).
// Create and update payloads are strict: the backend rejects unknown keys with a 422,
// so build them field by field instead of spreading an ItemRead into one.

// ============================================================
// Reference data (GET /reference/...)
// ============================================================
export interface LanguageRead {
  id: number;
  code: string;
  name: string;
}

export interface FormatRead {
  id: number;
  name: string;
  short_name: string | null;
  description: string | null;
}

export interface GenreRead {
  id: number;
  name: string;
  description: string | null;
  parent_genre_id: number | null; // build the genre tree from this
}

export interface FranchiseRead {
  id: number;
  name: string;
  description: string | null;
  parent_franchise_id: number | null;
}

export interface TagRead {
  id: number;
  name: string;
  description: string | null;
}

export interface ScaleRead {
  id: number;
  scale: string; // "1:7", "28 mm"
}

export interface JournalRead {
  id: number;
  name: string;
  description: string | null;
}

export interface GamePlatformRead {
  id: number;
  name: string;
  short_name: string | null;
  description: string | null;
}

export interface BarcodeTypeRead {
  id: number;
  name: string;
  description: string | null;
}

export interface ConditionTypeRead {
  id: number;
  name: string;
  description: string | null;
}

// ============================================================
// Subtype details (discriminated on type_name)
// ============================================================

// ---------- read: references are expanded objects ----------
export interface BookDetailsRead {
  type_name: "book";
  page_count: number | null;
}

export interface GameDetailsRead {
  type_name: "game";
  game_platform: GamePlatformRead | null;
}

export interface FilmDetailsRead {
  type_name: "film";
  length: number | null; // minutes
}

export interface BoardGameDetailsRead {
  type_name: "board_game";
}

export interface JournalIssueDetailsRead {
  type_name: "journal_issue";
  journal: JournalRead | null;
  issue: string | null;
  page_count: number | null;
}

export interface FigurineDetailsRead {
  type_name: "figurine";
  scale: ScaleRead | null;
}

export interface MiniatureDetailsRead {
  type_name: "miniature";
  height: number | null;
  width: number | null;
  scale: ScaleRead | null;
}

export interface LegoSetDetailsRead {
  type_name: "lego_set";
  number_of_pieces: number | null;
}

export type ItemDetailsRead =
  | BookDetailsRead
  | GameDetailsRead
  | FilmDetailsRead
  | BoardGameDetailsRead
  | JournalIssueDetailsRead
  | FigurineDetailsRead
  | MiniatureDetailsRead
  | LegoSetDetailsRead;

export type ItemType = ItemDetailsRead["type_name"];

// ---------- create / update: references are ids ----------
// Used for POST and for PATCH. On PATCH only the keys you send are changed
// (null clears), and type_name must match the item's current type (else 409).
export interface BookDetailsCreate {
  type_name: "book";
  page_count?: number | null; // >= 1
}

export interface GameDetailsCreate {
  type_name: "game";
  game_platform_id?: number | null;
}

export interface FilmDetailsCreate {
  type_name: "film";
  length?: number | null; // minutes, >= 1
}

export interface BoardGameDetailsCreate {
  type_name: "board_game";
}

export interface JournalIssueDetailsCreate {
  type_name: "journal_issue";
  journal_id?: number | null;
  issue?: string | null;
  page_count?: number | null; // >= 1
}

export interface FigurineDetailsCreate {
  type_name: "figurine";
  scale_id?: number | null;
}

export interface MiniatureDetailsCreate {
  type_name: "miniature";
  height?: number | null; // >= 0
  width?: number | null; // >= 0
  scale_id?: number | null;
}

export interface LegoSetDetailsCreate {
  type_name: "lego_set";
  number_of_pieces?: number | null; // >= 1
}

export type ItemDetailsCreate =
  | BookDetailsCreate
  | GameDetailsCreate
  | FilmDetailsCreate
  | BoardGameDetailsCreate
  | JournalIssueDetailsCreate
  | FigurineDetailsCreate
  | MiniatureDetailsCreate
  | LegoSetDetailsCreate;

// ============================================================
// Item types with their scope (GET /reference/item-types)
// ============================================================
export interface ItemTypeRead {
  id: number;
  name: ItemType;
  description: string | null;
}

// Formats and genres that apply to this type: use these to fill the form dropdowns.
// The backend rejects a format/genre outside the item type's scope with a 422.
export interface ItemTypeScopeRead extends ItemTypeRead {
  formats: FormatRead[];
  genres: GenreRead[];
}

// ============================================================
// Titles / languages
// ============================================================
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

// Language an item is available in, and for what (UI, text, voice).
export interface ItemLanguageRead {
  language: LanguageRead;
  ui: boolean | null;
  text: boolean | null;
  voice: boolean | null;
}

export interface ItemLanguageCreate {
  language_code: string;
  ui?: boolean | null;
  text?: boolean | null;
  voice?: boolean | null;
}

// ============================================================
// Author credits
// ============================================================
export interface AuthorRead {
  id: number;
  name: string;
}

export interface AuthorRoleRead {
  id: number;
  name: string;
  description: string | null;
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
  role_name: string; // matched or created by name
  involvement_date?: string | null;
  comments?: string | null;
};

// ============================================================
// Company credits
// ============================================================
export interface CompanyRead {
  id: number;
  name: string;
}

export interface CompanyRoleRead {
  id: number;
  name: string;
  description: string | null;
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

// ============================================================
// Barcodes
// ============================================================
export interface BarcodeRead {
  id: number;
  code: string;
  barcode_type: BarcodeTypeRead | null;
}

export interface BarcodeCreate {
  code: string; // whitespace is stripped by the backend
  barcode_type_id?: number | null;
}

// ============================================================
// Owned copies (read only for now: no create/edit endpoints yet)
// ============================================================
export interface ConditionRead {
  condition_type: ConditionTypeRead | null;
  notes: string | null;
}

export interface CopyPhotoRead {
  id: number;
  file_path: string;
  name: string | null;
  description: string | null;
}

export interface OwnedCopyRead {
  id: number;
  notes: string | null;
  condition: ConditionRead | null;
  photos: CopyPhotoRead[];
}

// ============================================================
// Items
// ============================================================
// Mirrors backend ItemBase.
export interface ItemBase {
  release_date: string | null;
  cover_image_path: string | null; // relative path to the cover image file
  icon_image_path: string | null;
  is_owned: boolean | null;
  description: string | null;
}

export interface ItemRead extends ItemBase {
  id: number;
  item_type: ItemTypeRead;
  format: FormatRead | null;
  selected_language: LanguageRead | null;
  titles: TitleRead[];
  languages: ItemLanguageRead[];
  genres: GenreRead[];
  franchises: FranchiseRead[];
  tags: TagRead[];
  barcodes: BarcodeRead[];
  owned_copies: OwnedCopyRead[];
  author_credits: AuthorCreditRead[];
  company_credits: CompanyCreditRead[];
  details: ItemDetailsRead | null; // null only if the subtype row is missing
}

export interface ItemCreate extends Partial<ItemBase> {
  format_id?: number | null; // must belong to the item type's scope
  selected_language_code?: string | null;
  languages?: ItemLanguageCreate[];
  titles?: TitleCreate[];
  genre_ids?: number[]; // must belong to the item type's scope
  franchise_ids?: number[];
  tags?: string[]; // tag names; created if missing
  barcodes?: BarcodeCreate[];
  author_credits?: AuthorCreditCreate[];
  company_credits?: CompanyCreditCreate[];
  details: ItemDetailsCreate; // decides the item type
}

// PATCH payload. Omit a key to leave it unchanged.
//   - scalar fields: null clears the value
//   - list fields: an array replaces the whole collection ([] clears it); don't send null
//   - details: partial, only the keys sent change; type_name must match the item's type
export interface ItemUpdate extends Partial<ItemBase> {
  format_id?: number | null;
  selected_language_code?: string | null;
  languages?: ItemLanguageCreate[];
  titles?: TitleCreate[];
  genre_ids?: number[];
  franchise_ids?: number[];
  tags?: string[];
  barcodes?: BarcodeCreate[];
  author_credits?: AuthorCreditCreate[];
  company_credits?: CompanyCreditCreate[];
  details?: ItemDetailsCreate;
}

export interface ItemListEntryRead {
  id: number;
  title: string;
  item_type: ItemType;
  release_date: string | null;
  is_owned: boolean;
  icon_image_path: string | null;
}

// ============================================================
// Pagination
// ============================================================
export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}