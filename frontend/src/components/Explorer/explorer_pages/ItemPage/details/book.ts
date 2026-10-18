import type { BookDetailsRead } from "@types";
import type { Row } from "../rows";

export const bookRows = (d: BookDetailsRead): Row[] => [
  { label: "Pages", value: d.page_count },
];
