import type { GameDetailsRead } from "@types";
import type { Row } from "../rows";

export const gameRows = (d: GameDetailsRead): Row[] => [
  { label: "Platform", value: d.game_platform?.name },
];
