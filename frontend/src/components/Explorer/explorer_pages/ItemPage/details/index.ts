import type { ItemDetailsRead, ItemType } from "@types";
import type { Row } from "../rows";
import { bookRows } from "./book";
import { gameRows } from "./game";
import { filmRows } from "./film";
import { boardGameRows } from "./boardGame";
import { journalIssueRows } from "./journalIssue";
import { figurineRows } from "./figurine";
import { miniatureRows } from "./miniature";
import { legoSetRows } from "./legoSet";

type DetailsOf<K extends ItemType> = Extract<ItemDetailsRead, { type_name: K }>;

// One row builder per subtype. The mapped type makes this fail to compile
// when a subtype is added to ItemDetailsRead but not registered here.
type RowBuilders = { [K in ItemType]: (details: DetailsOf<K>) => Row[] };

const rowBuilders: RowBuilders = {
  book: bookRows,
  game: gameRows,
  film: filmRows,
  board_game: boardGameRows,
  journal_issue: journalIssueRows,
  figurine: figurineRows,
  miniature: miniatureRows,
  lego_set: legoSetRows,
};

// Subtype-specific Info rows for an item. TypeScript can't correlate
// `details.type_name` with its builder across a union lookup, hence the cast;
// the RowBuilders type above is what actually guarantees the pairing.
export function detailRows(details: ItemDetailsRead | null): Row[] {
  if (!details) return [];
  const build = rowBuilders[details.type_name] as (d: ItemDetailsRead) => Row[];
  return build(details);
}
