import clsx from "clsx";
import styles from "./MenuBar.module.css";

export interface MenuBarItem {
  label: string;
  mnemonicIndex?: number; // index of letter to underline, e.g. 0 for "File"
  onClick?: () => void;
  disabled?: boolean;
}

interface MenuBarProps {
  items: MenuBarItem[];
  activeLabel?: string;
}

function MenuBar({ items, activeLabel }: MenuBarProps) {
  return (
    <div className={styles.bar}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={item.disabled}
          onClick={item.onClick}
          className={clsx(
            styles.item,
            item.label === activeLabel && styles.itemOpen,
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default MenuBar;
