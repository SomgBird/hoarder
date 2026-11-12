import { ITEM_TYPE, type ItemCreate, type ItemDetailsCreate, type ItemType } from "@types";
import type { ReferenceResource } from "../../../services/referenceService";

export type Values = Record<string, string | boolean | string[]>;

type FieldKind = "text" | "textarea" | "number" | "date" | "bool" | "reference";

export interface FieldSpec {
  key: string; // must match the backend key exactly: payloads are strict
  label: string;
  kind: FieldKind;
  required?: boolean;
  reference?: ReferenceResource;
  multiple?: boolean;
}

// ---------- item-level fields ----------
// ---------- item-level fields, grouped by where they sit on the page ----------
export const INFO_FIELDS: FieldSpec[] = [
  { key: "release_date", label: "Release date", kind: "date" },
  { key: "is_owned", label: "Owned", kind: "bool" },
  { key: "format_id", label: "Format", kind: "reference", reference: "formats" },
  { key: "selected_language_code", label: "Display language", kind: "reference", reference: "languages" },
  { key: "genre_ids", label: "Genres", kind: "reference", reference: "genres", multiple: true },
  { key: "franchise_ids", label: "Franchises", kind: "reference", reference: "franchises", multiple: true },
];

export const DESCRIPTION_FIELD: FieldSpec = {
  key: "description", label: "Description", kind: "textarea",
};

// ---------- repeatable lists ----------
export const TITLE_FIELDS: FieldSpec[] = [
  { key: "title_text", label: "Title", kind: "text", required: true },
  { key: "short_text", label: "Short title", kind: "text" },
  { key: "language_code", label: "Language", kind: "reference", reference: "languages", required: true },
];

export const LANGUAGE_FIELDS: FieldSpec[] = [
  { key: "language_code", label: "Language", kind: "reference", reference: "languages", required: true },
  { key: "ui", label: "UI", kind: "bool" },
  { key: "text", label: "Text", kind: "bool" },
  { key: "voice", label: "Voice", kind: "bool" },
];

export const BARCODE_FIELDS: FieldSpec[] = [
  { key: "code", label: "Code", kind: "text", required: true },
  { key: "barcode_type_id", label: "Barcode type", kind: "reference", reference: "barcode-types" },
];

export const CREDIT_FIELDS: FieldSpec[] = [
  { key: "role_name", label: "Role", kind: "reference", reference: "author-roles", required: true },
  { key: "involvement_date", label: "Involvement date", kind: "date" },
  { key: "comments", label: "Comments", kind: "text" },
];

// ---------- subtype fields ----------
export const DETAILS_FIELDS: Record<ItemType, FieldSpec[]> = {
  [ITEM_TYPE.book]: [{ key: "page_count", label: "Page count", kind: "number" }],
  [ITEM_TYPE.game]: [{ key: "game_platform_id", label: "Game platform", kind: "reference", reference: "game-platforms" }],
  [ITEM_TYPE.film]: [{ key: "length", label: "Length (minutes)", kind: "number" }],
  [ITEM_TYPE.board_game]: [],
  [ITEM_TYPE.journal_issue]: [
    { key: "journal_id", label: "Journal", kind: "reference", reference: "journals" },
    { key: "issue", label: "Issue", kind: "text" },
    { key: "page_count", label: "Page count", kind: "number" },
  ],
  [ITEM_TYPE.figurine]: [{ key: "scale_id", label: "Scale", kind: "reference", reference: "scales" }],
  [ITEM_TYPE.miniature]: [
    { key: "height", label: "Height", kind: "number" },
    { key: "width", label: "Width", kind: "number" },
    { key: "scale_id", label: "Scale", kind: "reference", reference: "scales" },
  ],
  [ITEM_TYPE.lego_set]: [{ key: "number_of_pieces", label: "Number of pieces", kind: "number" }],
};

// ============================================================
// Form values
// ============================================================

const isBlank = (row: Values) =>
  Object.values(row).every((v) => v === "" || v === false || v === undefined);


export interface FormState {
  itemType: ItemType;
  item: Values;
  details: Values;
  titles: Values[];
  languages: Values[];
  barcodes: Values[];
  authorCredits: Values[];
  companyCredits: Values[];
}

// ---------- small parsers ----------
const text = (v: Values[string] | undefined): string | undefined => {
  const s = typeof v === "string" ? v.trim() : "";
  return s || undefined;
};

const num = (v: Values[string] | undefined, label: string): number | undefined => {
  const s = text(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  if (Number.isNaN(n)) throw new Error(`${label} must be a number.`);
  return n;
};

const list = (v: Values[string] | undefined) =>
  Array.isArray(v) ? v : (text(v)?.split(",").map((x) => x.trim()).filter(Boolean)) ?? [];

const required = (v: Values[string] | undefined, label: string): string => {
  const s = text(v);
  if (!s) throw new Error(`${label} is required.`);
  return s;
};

const nonBlank = (rows: Values[]) => rows.filter((r) => !isBlank(r));

const existingId = (row: Values, key: string, label: string): number => {
  const id = num(row[key], label);
  if (!Number.isSafeInteger(id) || id! < 1) throw new Error(`Select an existing ${label.toLowerCase()} or choose Create new.`);
  return id!;
};

// ---------- subtype: the compiler checks each branch against its own type ----------
function buildDetails(type: ItemType, v: Values): ItemDetailsCreate {
  switch (type) {
    case ITEM_TYPE.book:
      return { type_name: type, page_count: num(v.page_count, "Page count") };
    case ITEM_TYPE.game:
      return { type_name: type, game_platform_id: num(v.game_platform_id, "Game platform") };
    case ITEM_TYPE.film:
      return { type_name: type, length: num(v.length, "Length") };
    case ITEM_TYPE.board_game:
      return { type_name: type };
    case ITEM_TYPE.journal_issue:
      return {
        type_name: type,
        journal_id: num(v.journal_id, "Journal"),
        issue: text(v.issue),
        page_count: num(v.page_count, "Page count"),
      };
    case ITEM_TYPE.figurine:
      return { type_name: type, scale_id: num(v.scale_id, "Scale") };
    case ITEM_TYPE.miniature:
      return {
        type_name: type,
        height: num(v.height, "Height"),
        width: num(v.width, "Width"),
        scale_id: num(v.scale_id, "Scale"),
      };
    case ITEM_TYPE.lego_set:
      return { type_name: type, number_of_pieces: num(v.number_of_pieces, "Number of pieces") };
    default: {
      const unreachable: never = type; // compile error if a new type is added and not handled here
      throw new Error(`Unhandled item type: ${unreachable}`);
    }
  }
}

export function buildItemCreate(f: FormState): ItemCreate {
  const titles = nonBlank(f.titles).map((r) => ({
    title_text: required(r.title_text, "Title"),
    short_text: text(r.short_text),
    language_code: required(r.language_code, "Title language"),
  }));
  if (titles.length === 0) throw new Error("At least one title is required.");

  const i = f.item;
  return {
    release_date: text(i.release_date),
    is_owned: i.is_owned === true,
    description: text(i.description),
    format_id: num(i.format_id, "Format"),
    selected_language_code: text(i.selected_language_code),
    genre_ids: list(i.genre_ids).map((s) => num(s, "Genre")!),
    franchise_ids: list(i.franchise_ids).map((s) => num(s, "Franchise")!),
    tags: list(i.tags),
    titles,
    languages: nonBlank(f.languages).map((r) => ({
      language_code: required(r.language_code, "Language"),
      ui: r.ui === true,
      text: r.text === true,
      voice: r.voice === true,
    })),
    barcodes: nonBlank(f.barcodes).map((r) => ({
      code: required(r.code, "Barcode"),
      barcode_type_id: num(r.barcode_type_id, "Barcode type"),
    })),
    author_credits: nonBlank(f.authorCredits).map((r) => ({
      ...(r.reference_mode === "new"
        ? { author_name: required(r.author_name, "Author name") }
        : { author_id: existingId(r, "author_id", "Author") }),
      role_name: required(r.role_name, "Author role"),
      involvement_date: text(r.involvement_date),
      comments: text(r.comments),
    })),
    company_credits: nonBlank(f.companyCredits).map((r) => ({
      ...(r.reference_mode === "new"
        ? { company_name: required(r.company_name, "Company name") }
        : { company_id: existingId(r, "company_id", "Company") }),
      role_name: required(r.role_name, "Company role"),
      involvement_date: text(r.involvement_date),
      comments: text(r.comments),
    })),
    details: buildDetails(f.itemType, f.details),
  };
}
