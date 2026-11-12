import type {
  AuthorRead, CompanyRead, LanguageRead, FormatRead, GenreRead, FranchiseRead,
  TagRead, ScaleRead, JournalRead, GamePlatformRead, BarcodeTypeRead,
  AuthorRoleRead, CompanyRoleRead, ReferenceCreate,
} from "@types";
import { request } from "./client.ts";

type ReferenceLists = {
  languages: LanguageRead;
  formats: FormatRead;
  genres: GenreRead;
  franchises: FranchiseRead;
  tags: TagRead;
  scales: ScaleRead;
  journals: JournalRead;
  "game-platforms": GamePlatformRead;
  "barcode-types": BarcodeTypeRead;
  "author-roles": AuthorRoleRead;
  "company-roles": CompanyRoleRead;
};
export type ReferenceResource = keyof ReferenceLists;
export type CreatableReference = Exclude<ReferenceResource, "languages">;
export type ReferenceEntity = ReferenceLists[ReferenceResource];
export const REFERENCE_RESOURCES = [
  "languages", "formats", "genres", "franchises", "tags", "scales", "journals",
  "game-platforms", "barcode-types", "author-roles", "company-roles",
] as const satisfies readonly ReferenceResource[];

export const referenceService = {
  list: <R extends ReferenceResource>(resource: R, itemType?: string, signal?: AbortSignal) => {
    const query = itemType && (resource === "formats" || resource === "genres")
      ? `?item_type=${encodeURIComponent(itemType)}` : "";
    return request<ReferenceLists[R][]>(`/reference/${resource}${query}`, { signal });
  },
  create: <R extends CreatableReference>(resource: R, payload: ReferenceCreate) =>
    request<ReferenceLists[R]>(`/reference/${resource}`, { method: "POST", body: JSON.stringify(payload) }),
  authors: (query: string, signal?: AbortSignal) =>
    request<AuthorRead[]>(`/reference/authors?q=${encodeURIComponent(query)}&limit=20`, { signal }),
  companies: (query: string, signal?: AbortSignal) =>
    request<CompanyRead[]>(`/reference/companies?q=${encodeURIComponent(query)}&limit=20`, { signal }),
};
