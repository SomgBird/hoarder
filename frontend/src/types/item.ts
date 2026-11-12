// Public aliases for the generated API contract. Dates are ISO strings.
// Keep API fields in backend/app/db/schemas.py and run npm run generate:types.
import type { components } from "./api.generated";

type Schemas = components["schemas"];
export type ReferenceCreate = Schemas["ReferenceCreate"];

export type LanguageRead = Schemas["LanguageRead"];
export type FormatRead = Schemas["FormatRead"];
export type GenreRead = Schemas["GenreRead"];
export type FranchiseRead = Schemas["FranchiseRead"];
export type TagRead = Schemas["TagRead"];
export type ScaleRead = Schemas["ScaleRead"];
export type JournalRead = Schemas["JournalRead"];
export type GamePlatformRead = Schemas["GamePlatformRead"];
export type BarcodeTypeRead = Schemas["BarcodeTypeRead"];
export type ConditionTypeRead = Schemas["ConditionTypeRead"];
export type BookDetailsRead = Schemas["BookDetailsRead"];
export type GameDetailsRead = Schemas["GameDetailsRead"];
export type FilmDetailsRead = Schemas["FilmDetailsRead"];
export type BoardGameDetailsRead = Schemas["BoardGameDetailsRead"];
export type JournalIssueDetailsRead = Schemas["JournalIssueDetailsRead"];
export type FigurineDetailsRead = Schemas["FigurineDetailsRead"];
export type MiniatureDetailsRead = Schemas["MiniatureDetailsRead"];
export type LegoSetDetailsRead = Schemas["LegoSetDetailsRead"];
export type ItemDetailsRead = NonNullable<ItemRead["details"]>;
export type BookDetailsCreate = Schemas["BookDetailsCreate"];
export type GameDetailsCreate = Schemas["GameDetailsCreate"];
export type FilmDetailsCreate = Schemas["FilmDetailsCreate"];
export type BoardGameDetailsCreate = Schemas["BoardGameDetailsCreate"];
export type JournalIssueDetailsCreate = Schemas["JournalIssueDetailsCreate"];
export type FigurineDetailsCreate = Schemas["FigurineDetailsCreate"];
export type MiniatureDetailsCreate = Schemas["MiniatureDetailsCreate"];
export type LegoSetDetailsCreate = Schemas["LegoSetDetailsCreate"];
export type ItemDetailsCreate = ItemCreate["details"];
export type ItemTypeRead = Schemas["ItemTypeRead"];
export type ItemTypeScopeRead = Schemas["ItemTypeScopeRead"];
export type TitleRead = Schemas["TitleRead"];
export type TitleCreate = Schemas["TitleCreate"];
export type ItemLanguageRead = Schemas["ItemLanguageRead"];
export type ItemLanguageCreate = Schemas["ItemLanguageCreate"];
export type AuthorRead = Schemas["AuthorRead"];
export type AuthorRoleRead = Schemas["AuthorRoleRead"];
export type AuthorCreditRead = Schemas["AuthorCreditRead"];
export type AuthorCreditCreate = Schemas["AuthorCreditCreate"];
export type CompanyRead = Schemas["CompanyRead"];
export type CompanyRoleRead = Schemas["CompanyRoleRead"];
export type CompanyCreditRead = Schemas["CompanyCreditRead"];
export type CompanyCreditCreate = Schemas["CompanyCreditCreate"];
export type BarcodeRead = Schemas["BarcodeRead"];
export type BarcodeCreate = Schemas["BarcodeCreate"];
export type ConditionRead = Schemas["ConditionRead"];
export type CopyPhotoRead = Schemas["CopyPhotoRead"];
export type OwnedCopyRead = Schemas["OwnedCopyRead"];
export type ItemBase = Pick<ItemRead,
  "release_date" | "cover_image_path" | "icon_image_path" | "is_owned" | "description"
>;
export type ItemRead = Schemas["ItemRead"];
export type ItemCreate = Schemas["ItemCreate"];
export type ItemUpdate = Schemas["ItemUpdate"];
export type ItemListEntryRead = Schemas["ItemListEntryRead"];
export type Page<T> = Omit<ItemListPage, "items"> & { items: T[] };
export type ItemListPage = Schemas["Page_ItemListEntryRead_"];
