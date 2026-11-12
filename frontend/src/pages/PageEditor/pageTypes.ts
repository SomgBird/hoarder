import type { ItemType } from "@types";

export type PageType = "item" | "franchise" | "article" | "custom";

export interface PageData {
  pageType: PageType;
  title: string;
  itemType: ItemType | null;
}