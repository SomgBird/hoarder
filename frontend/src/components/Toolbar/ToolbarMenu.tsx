import { List } from "@react95/core";
import { ToolbarButton, type ToolbarButtonProps } from "./ToolbarButton";
import styles from "./Toolbar.module.css";

type Props = Omit<
  ToolbarButtonProps,
  "onClick" | "icon" | "label" | "arrow"
> & {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode; // List.Item elements
};

export function ToolbarMenu({ children, ...buttonProps }: Props) {
  return (
    <div className={styles.menu}>
      <ToolbarButton {...buttonProps} arrow="down" aria-haspopup="menu" />
      <List className={styles.menuList}>{children}</List>
    </div>
  );
}
