import type {
  AuthorCreditCreate, CompanyCreditCreate, ItemCreate, ItemDetailsRead,
  ItemListPage, ItemRead, ItemType, ItemUpdate,
} from "../../src/types/index";
import type { paths } from "../../src/types/api.generated";

export const minimalItem: ItemCreate = {
  details: { type_name: "book" },
  titles: [{ title_text: "Example", language_code: "en" }],
};

// @ts-expect-error The API requires titles even though the old manual type did not.
export const missingTitles: ItemCreate = { details: { type_name: "book" } };

export const existingAuthor: AuthorCreditCreate = { author_id: 7, role_name: "Writer" };
export const newAuthor: AuthorCreditCreate = { author_name: "Writer", role_name: "Writer" };
export const nullableAuthor: AuthorCreditCreate = { author_id: 7, author_name: null, role_name: "Writer" };
// @ts-expect-error A credit must select an existing author or create a new author.
export const missingAuthor: AuthorCreditCreate = { role_name: "Writer" };
// @ts-expect-error Existing IDs and new names cannot be sent together.
export const conflictingAuthor: AuthorCreditCreate = { author_id: 7, author_name: "Writer", role_name: "Writer" };

export const existingCompany: CompanyCreditCreate = { company_id: 9, role_name: "Publisher" };
export const newCompany: CompanyCreditCreate = { company_name: "Publisher", role_name: "Publisher" };
// @ts-expect-error A company reference is required.
export const missingCompany: CompanyCreditCreate = { role_name: "Publisher" };
// @ts-expect-error Company IDs and names are mutually exclusive too.
export const conflictingCompany: CompanyCreditCreate = { company_id: 9, company_name: "Publisher", role_name: "Publisher" };

export const partialUpdate: ItemUpdate = { description: null };
// @ts-expect-error Titles may be omitted on PATCH, but explicit null is rejected.
export const nullTitles: ItemUpdate = { titles: null };
export const nullableDate: ItemRead["release_date"] = null;
export const serializedDate: ItemRead["release_date"] = "2026-11-12";
export const subtypeName: ItemType = "journal_issue";
// @ts-expect-error Item type names must come from the API's details union.
export const unknownSubtype: ItemType = "unknown";

export function bookPages(details: ItemDetailsRead): number | null {
  if (details.type_name !== "book") return null;
  // @ts-expect-error The discriminator must narrow to book details.
  void details.game_platform;
  return details.page_count;
}

export function serializedFields(item: ItemRead): string {
  // Response fields with defaults are present; optional request fields stay optional.
  const description: string | null = item.description;
  const title: string = item.display_title;
  const languages: ItemRead["languages"] = item.languages;
  return `${title}: ${description ?? ""} (${languages.length})`;
}

// Pagination metadata and list entries must match the actual endpoint response.
type ListResponse = paths["/items/itemlist"]["get"]["responses"][200]["content"]["application/json"];
export function listResponse(page: ItemListPage): ListResponse {
  return page;
}
