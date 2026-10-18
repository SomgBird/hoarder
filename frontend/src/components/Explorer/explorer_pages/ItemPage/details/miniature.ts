import type { MiniatureDetailsRead } from "@types";
import type { Row } from "../rows";

export const miniatureRows = (d: MiniatureDetailsRead): Row[] => [
  { label: "Height", value: d.height },
  { label: "Width", value: d.width },
  { label: "Scale", value: d.scale?.scale },
];
