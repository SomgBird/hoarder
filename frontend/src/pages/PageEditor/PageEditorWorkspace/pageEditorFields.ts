import { ITEM_TYPE, ITEM_TYPES, type ItemCreate, type ItemDetailsCreate, type ItemRead, type ItemType, type ItemUpdate } from "@types";
import type { ReferenceResource } from "../../../services/referenceService";

export type Values = Record<string, string | boolean | string[] | null>;

type FieldKind = "text" | "textarea" | "number" | "date" | "bool" | "reference";

export interface FieldSpec {
  key: string; // must match the backend key exactly: payloads are strict
  label: string;
  kind: FieldKind;
  required?: boolean;
  reference?: ReferenceResource;
  multiple?: boolean;
}

// Item properties grouped by editor tab.
export const GENERAL_FIELDS: FieldSpec[] = [
  { key: "release_date", label: "Release date", kind: "date" },
  { key: "is_owned", label: "Owned", kind: "bool" },
];

export const CATALOG_FIELDS: FieldSpec[] = [
  { key: "format_id", label: "Format", kind: "reference", reference: "formats" },
  { key: "genre_ids", label: "Genres", kind: "reference", reference: "genres", multiple: true },
  { key: "franchise_ids", label: "Franchises", kind: "reference", reference: "franchises", multiple: true },
  { key: "tags", label: "Tags", kind: "reference", reference: "tags", multiple: true },
];

export const DISPLAY_LANGUAGE_FIELD: FieldSpec = {
  key: "selected_language_code", label: "Display language", kind: "reference", reference: "languages",
};

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
  Object.values(row).every((v) => v === "" || v === false || v == null);


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

/** Convert API references and nullable values to the controls' string values. */
export function itemToFormState(source: ItemRead): FormState {
  const itemType = ITEM_TYPES.find((type) => type === source.item_type.name);
  if (!itemType) throw new Error(`Unsupported item type: ${source.item_type.name}`);
  const details: Values = {};
  for (const [key, value] of Object.entries(source.details ?? {})) {
    if (typeof value === "number" || typeof value === "string") details[key] = String(value);
  }
  if (source.details && "game_platform" in source.details) details.game_platform_id = String(source.details.game_platform?.id ?? "");
  if (source.details && "journal" in source.details) details.journal_id = String(source.details.journal?.id ?? "");
  if (source.details && "scale" in source.details) details.scale_id = String(source.details.scale?.id ?? "");
  return {
    itemType,
    item: {
      release_date: source.release_date ?? "",
      is_owned: source.is_owned,
      description: source.description ?? "",
      format_id: String(source.format?.id ?? ""),
      selected_language_code: source.selected_language?.code ?? "",
      genre_ids: source.genres.map((value) => String(value.id)),
      franchise_ids: source.franchises.map((value) => String(value.id)),
      tags: source.tags.map((value) => value.name),
    },
    details,
    titles: [...source.titles].sort((a, b) => a.id - b.id).map((title) => ({
      title_text: title.title_text,
      short_text: title.short_text ?? "",
      language_code: title.language?.code ?? "",
    })),
    languages: source.languages.map((entry) => ({
      language_code: entry.language.code, ui: entry.ui, text: entry.text, voice: entry.voice,
    })),
    barcodes: source.barcodes.map((entry) => ({ code: entry.code, barcode_type_id: String(entry.barcode_type?.id ?? "") })),
    authorCredits: source.author_credits.map((entry, index) => ({
      row_key: `author-${index}`, reference_mode: "existing", author_id: String(entry.author.id), selected_name: entry.author.name,
      role_name: entry.role.name, involvement_date: entry.involvement_date ?? "", comments: entry.comments ?? "",
    })),
    companyCredits: source.company_credits.map((entry, index) => ({
      row_key: `company-${index}`, reference_mode: "existing", company_id: String(entry.company.id), selected_name: entry.company.name,
      role_name: entry.role.name, involvement_date: entry.involvement_date ?? "", comments: entry.comments ?? "",
    })),
  };
}

// ---------- small parsers ----------
// An untouched unknown checkbox stays null; interacting with it sets a boolean.
const bool = (v: Values[string] | undefined): boolean | null => v === null ? null : v === true;

const text = (v: Values[string] | undefined): string | undefined => {
  const s = typeof v === "string" ? v.trim() : "";
  return s || undefined;
};

const num = (v: Values[string] | undefined, label: string): number | undefined => {
  const s = text(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`${label} must be a number.`);
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

function buildTitles(rows: Values[]) {
  const titles = nonBlank(rows).map((row) => ({
    title_text: required(row.title_text, "Title"),
    short_text: text(row.short_text),
    language_code: required(row.language_code, "Title language"),
  }));
  if (!titles.length) throw new Error("At least one title is required.");
  return titles;
}

function buildLanguages(rows: Values[]) {
  return nonBlank(rows).map((row) => ({
    language_code: required(row.language_code, "Language"),
    ui: bool(row.ui),
    text: bool(row.text),
    voice: bool(row.voice),
  }));
}

function buildBarcodes(rows: Values[]) {
  return nonBlank(rows).map((row) => ({
    code: required(row.code, "Barcode"),
    barcode_type_id: num(row.barcode_type_id, "Barcode type"),
  }));
}

function buildAuthorCredits(rows: Values[]) {
  return nonBlank(rows).map((row) => ({
    ...(row.reference_mode === "new"
      ? { author_name: required(row.author_name, "Author name") }
      : { author_id: existingId(row, "author_id", "Author") }),
    role_name: required(row.role_name, "Author role"),
    involvement_date: text(row.involvement_date),
    comments: text(row.comments),
  }));
}

function buildCompanyCredits(rows: Values[]) {
  return nonBlank(rows).map((row) => ({
    ...(row.reference_mode === "new"
      ? { company_name: required(row.company_name, "Company name") }
      : { company_id: existingId(row, "company_id", "Company") }),
    role_name: required(row.role_name, "Company role"),
    involvement_date: text(row.involvement_date),
    comments: text(row.comments),
  }));
}

function buildItemFields(item: Values) {
  return {
    release_date: text(item.release_date),
    description: text(item.description),
    is_owned: bool(item.is_owned),
    format_id: num(item.format_id, "Format"),
    selected_language_code: text(item.selected_language_code),
    genre_ids: list(item.genre_ids).map((id) => num(id, "Genre")!),
    franchise_ids: list(item.franchise_ids).map((id) => num(id, "Franchise")!),
    tags: list(item.tags),
  };
}

export function buildItemCreate(form: FormState): ItemCreate {
  return {
    ...buildItemFields(form.item),
    titles: buildTitles(form.titles),
    languages: buildLanguages(form.languages),
    barcodes: buildBarcodes(form.barcodes),
    author_credits: buildAuthorCredits(form.authorCredits),
    company_credits: buildCompanyCredits(form.companyCredits),
    details: buildDetails(form.itemType, form.details),
  };
}

function differs(current: unknown, initial: unknown) {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

function changedFields(current: Record<string, unknown>, initial: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(current)
    .filter(([key, value]) => differs(value, initial[key]))
    .map(([key, value]) => [key, value ?? null]));
}

/** PATCH replaces a submitted list, so leave untouched lists and fields on the server. */
export function buildItemUpdate(form: FormState, initial: FormState): ItemUpdate {
  const update: ItemUpdate = changedFields(buildItemFields(form.item), buildItemFields(initial.item));
  const details = changedFields(buildDetails(form.itemType, form.details), buildDetails(initial.itemType, initial.details));
  if (Object.keys(details).length) update.details = { type_name: form.itemType, ...details };

  if (differs(form.titles, initial.titles)) update.titles = buildTitles(form.titles);
  if (differs(form.languages, initial.languages)) update.languages = buildLanguages(form.languages);
  if (differs(form.barcodes, initial.barcodes)) update.barcodes = buildBarcodes(form.barcodes);
  if (differs(form.authorCredits, initial.authorCredits)) update.author_credits = buildAuthorCredits(form.authorCredits);
  if (differs(form.companyCredits, initial.companyCredits)) update.company_credits = buildCompanyCredits(form.companyCredits);
  return update;
}
