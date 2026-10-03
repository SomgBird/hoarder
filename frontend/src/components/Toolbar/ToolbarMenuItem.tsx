import { List } from "@react95/core";
import clsx from "clsx";
import styles from "./Toolbar.module.css";

type Props = React.ComponentProps<typeof List.Item> & {
  checked?: boolean; // omit for plain items; pass true/false on every item of a radio-style group
};

export function ToolbarMenuItem({
  checked,
  className,
  children,
  ...rest
}: Props) {
  return (
    <List.Item
      className={clsx(styles.menuItem, className)}
      role={checked === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={checked}
      {...rest}
    >
      {checked !== undefined && (
        <span className={styles.check} aria-hidden="true">
          {checked ? "✓" : ""}
        </span>
      )}
      {children}
    </List.Item>
  );
}
