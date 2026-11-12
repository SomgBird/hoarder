import type { FigurineDetailsRead } from "@types";
import type { Row } from "../rows";

export const figurineRows = (d: FigurineDetailsRead): Row[] => [
  { label: "Scale", value: d.scale?.scale },
];
