import { ITEM_TYPE, type ItemCreate, type ItemDetailsCreate, type ItemType } from "@types";

export type Values = Record<string, string | boolean>;

type FieldKind = "text" | "textarea" | "number" | "date" | "bool" | "ids" | "tags";

export interface FieldSpec {
  key: string; // must match the backend key exactly: payloads are strict
  label: string;
  kind: FieldKind;
  required?: boolean;
}

// ---------- item-level fields ----------
export const ITEM_FIELDS: FieldSpec[] = [
  { key: "release_date", label: "Release date", kind: "date" },
  { key: "cover_image_path", label: "Cover image path", kind: "text" },
  { key: "icon_image_path", label: "Icon image path", kind: "text" },
  { key: "is_owned", label: "Owned", kind: "bool" },
  { key: "description", label: "Description", kind: "textarea" },
  { key: "format_id", label: "Format ID", kind: "number" },
  { key: "selected_language_code", label: "Selected language code", kind: "text" },
  { key: "genre_ids", label: "Genre IDs (comma separated)", kind: "ids" },
  { key: "franchise_ids", label: "Franchise IDs (comma separated)", kind: "ids" },
  { key: "tags", label: "Tags (comma separated)", kind: "tags" },
];

// ---------- repeatable lists ----------
export const TITLE_FIELDS: FieldSpec[] = [
  { key: "title_text", label: "Title", kind: "text", required: true },
  { key: "short_text", label: "Short title", kind: "text" },
  { key: "language_code", label: "Language code", kind: "text", required: true },
];

export const LANGUAGE_FIELDS: FieldSpec[] = [
  { key: "language_code", label: "Language code", kind: "text", required: true },
  { key: "ui", label: "UI", kind: "bool" },
  { key: "text", label: "Text", kind: "bool" },
  { key: "voice", label: "Voice", kind: "bool" },
];

export const BARCODE_FIELDS: FieldSpec[] = [
  { key: "code", label: "Code", kind: "text", required: true },
  { key: "barcode_type_id", label: "Barcode type ID", kind: "number" },
];

export const AUTHOR_CREDIT_FIELDS: FieldSpec[] = [
  { key: "author_name", label: "Author name", kind: "text", required: true },
  { key: "role_name", label: "Role", kind: "text", required: true },
  { key: "involvement_date", label: "Involvement date", kind: "date" },
  { key: "comments", label: "Comments", kind: "text" },
];

export const COMPANY_CREDIT_FIELDS: FieldSpec[] = [
  { key: "company_name", label: "Company name", kind: "text", required: true },
  { key: "role_name", label: "Role", kind: "text", required: true },
  { key: "involvement_date", label: "Involvement date", kind: "date" },
  { key: "comments", label: "Comments", kind: "text" },
];

// ---------- subtype fields ----------
export const DETAILS_FIELDS: Record<ItemType, FieldSpec[]> = {
  [ITEM_TYPE.book]: [{ key: "page_count", label: "Page count", kind: "number" }],
  [ITEM_TYPE.game]: [{ key: "game_platform_id", label: "Game platform ID", kind: "number" }],
  [ITEM_TYPE.film]: [{ key: "length", label: "Length (minutes)", kind: "number" }],
  [ITEM_TYPE.board_game]: [],
  [ITEM_TYPE.journal_issue]: [
    { key: "journal_id", label: "Journal ID", kind: "number" },
    { key: "issue", label: "Issue", kind: "text" },
    { key: "page_count", label: "Page count", kind: "number" },
  ],
  [ITEM_TYPE.figurine]: [{ key: "scale_id", label: "Scale ID", kind: "number" }],
  [ITEM_TYPE.miniature]: [
    { key: "height", label: "Height", kind: "number" },
    { key: "width", label: "Width", kind: "number" },
    { key: "scale_id", label: "Scale ID", kind: "number" },
  ],
  [ITEM_TYPE.lego_set]: [{ key: "number_of_pieces", label: "Number of pieces", kind: "number" }],
};

// ============================================================
// Form values -> payload
// ============================================================
const splitList = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

function toNumber(spec: FieldSpec, raw: string): number {
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`${spec.label} must be a number.`);
  return n;
}

/** Converts string form values to the typed payload. Empty values are omitted. */
function toPayload(specs: FieldSpec[], values: Values): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const spec of specs) {
    const v = values[spec.key];

    if (spec.kind === "bool") {
      out[spec.key] = v === true;
      continue;
    }

    const text = typeof v === "string" ? v.trim() : "";
    if (!text) {
      if (spec.required) throw new Error(`${spec.label} is required.`);
      continue;
    }

    switch (spec.kind) {
      case "number": out[spec.key] = toNumber(spec, text); break;
      case "ids":    out[spec.key] = splitList(text).map((s) => toNumber(spec, s)); break;
      case "tags":   out[spec.key] = splitList(text); break;
      default:       out[spec.key] = text;
    }
  }
  return out;
}

const isBlank = (row: Values) =>
  Object.values(row).every((v) => v === "" || v === false || v === undefined);

/** Rows the user added but left empty are dropped. */
const rowsPayload = (specs: FieldSpec[], rows: Values[]) =>
  rows.filter((r) => !isBlank(r)).map((r) => toPayload(specs, r));

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

/** Throws an Error with a user-readable message when the form is invalid. */
export function buildItemCreate(f: FormState): ItemCreate {
  const titles = rowsPayload(TITLE_FIELDS, f.titles);
  if (titles.length === 0) throw new Error("At least one title is required.");

  return {
    ...toPayload(ITEM_FIELDS, f.item),
    titles,
    languages: rowsPayload(LANGUAGE_FIELDS, f.languages),
    barcodes: rowsPayload(BARCODE_FIELDS, f.barcodes),
    author_credits: rowsPayload(AUTHOR_CREDIT_FIELDS, f.authorCredits),
    company_credits: rowsPayload(COMPANY_CREDIT_FIELDS, f.companyCredits),
    details: {
      type_name: f.itemType,
      ...toPayload(DETAILS_FIELDS[f.itemType], f.details),
    } as unknown as ItemDetailsCreate,
  }  as unknown as ItemCreate;
}