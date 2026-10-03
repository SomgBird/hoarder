import { List } from "@react95/core";
import { Toolbar as Root } from "./Toolbar";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarMenu } from "./ToolbarMenu";
import { ToolbarMenuItem } from "./ToolbarMenuItem";
import { ToolbarSeparator } from "./ToolbarSeparator";

export const Toolbar = Object.assign(Root, {
  Button: ToolbarButton,
  Menu: ToolbarMenu,
  MenuItem: ToolbarMenuItem,
  MenuDivider: List.Divider,
  Separator: ToolbarSeparator,
});