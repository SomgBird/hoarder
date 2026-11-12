import type { ItemDetailsCreate } from "./item";

/** Supported names come from the backend's discriminated details union. */
export type ItemType = ItemDetailsCreate["type_name"];

/** UI constants: the compiler requires a matching entry for each API subtype. */
export const ITEM_TYPE = {
  book: "book",
  game: "game",
  film: "film",
  board_game: "board_game",
  journal_issue: "journal_issue",
  figurine: "figurine",
  miniature: "miniature",
  lego_set: "lego_set",
} as const satisfies { [K in ItemType]: K };

/** All type names as a runtime array, in the order above. Use it for dropdowns. */
export const ITEM_TYPES: readonly ItemType[] = Object.values(ITEM_TYPE);

/** Human-readable names for the UI. Record<ItemType, ...> forces a label for every type. */
export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  book: "Book",
  game: "Video game",
  film: "Film",
  board_game: "Board game",
  journal_issue: "Journal issue",
  figurine: "Figurine",
  miniature: "Miniature",
  lego_set: "LEGO set",
};

/** Ready-made options for a dropdown. */
export const ITEM_TYPE_OPTIONS = ITEM_TYPES.map((t) => ({ value: t, label: ITEM_TYPE_LABELS[t] }));


// --- For react95's native <Dropdown>, which only accepts plain strings as options ---
 
/** Labels in dropdown order. */
export const ITEM_TYPE_LABEL_LIST: string[] = ITEM_TYPES.map((t) => ITEM_TYPE_LABELS[t]);
 
/** Maps the label chosen in the dropdown back to the ItemType (null for the empty choice). */
export const itemTypeFromLabel = (label: string): ItemType | null =>
  ITEM_TYPES.find((t) => ITEM_TYPE_LABELS[t] === label) ?? null;
