import { createContext } from "react";

export type LabelPosition = "right" | "bottom";

export const ToolbarContext = createContext<{ labelPosition: LabelPosition }>({
  labelPosition: "right",
});