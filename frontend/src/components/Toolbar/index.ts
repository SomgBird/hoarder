import { Toolbar as Root } from "./Toolbar";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarSeparator } from "./ToolbarSeparator";

export const Toolbar = Object.assign(Root, {
  Button: ToolbarButton,
  Separator: ToolbarSeparator,
});