import type { BoardGameDetailsRead } from "@types";
import type { Row } from "../rows";

// No subtype-specific fields yet.
// TODO: Add board game specific fields when they exist in the API.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const boardGameRows = (_d: BoardGameDetailsRead): Row[] => [];
