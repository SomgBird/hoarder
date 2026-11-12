import type { LegoSetDetailsRead } from "@types";
import type { Row } from "../rows";

export const legoSetRows = (d: LegoSetDetailsRead): Row[] => [
  { label: "Pieces", value: d.number_of_pieces },
];
