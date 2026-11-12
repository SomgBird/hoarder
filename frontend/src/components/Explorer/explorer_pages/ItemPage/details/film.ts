import type { FilmDetailsRead } from "@types";
import type { Row } from "../rows";

export const filmRows = (d: FilmDetailsRead): Row[] => [
  { label: "Length", value: d.length != null ? `${d.length} min` : null },
];
