import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./MenuBar.module.css";

export interface MenuBarAction {
  label: string;
  mnemonicIndex?: number;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export type MenuBarEntry = MenuBarAction | { separator: true };

export interface MenuBarItem {
  label: string;
  mnemonicIndex?: number;
  entries: MenuBarEntry[];
  disabled?: boolean;
}

interface MenuBarProps {
  items: MenuBarItem[];
  label?: string;
}

function mnemonic(label: string, index?: number) {
  if (index === undefined || index < 0 || index >= label.length) return label;
  return <>{label.slice(0, index)}<u>{label[index]}</u>{label.slice(index + 1)}</>;
}

function focusCommand(popup: HTMLElement, edge: "first" | "last") {
  const commands = popup.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
  commands[edge === "last" ? commands.length - 1 : 0]?.focus();
}

function MenuBar({ items, label = "Explorer menu" }: MenuBarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const bar = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocus = useRef<"first" | "last" | false>(false);
  const id = useId();

  const close = (restoreFocus = false) => {
    pendingFocus.current = false;
    setOpenIndex(null);
    if (restoreFocus && openIndex !== null) triggers.current[openIndex]?.focus();
  };

  const open = useCallback((index: number, focus: "first" | "last" | false = false) => {
    pendingFocus.current = focus;
    setOpenIndex(index);
    setFocusIndex(index);
    if (focus) {
      const popup = bar.current?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`);
      if (popup) {
        focusCommand(popup, focus);
        pendingFocus.current = false;
      }
    }
  }, []);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!bar.current?.contains(event.target as Node)) setOpenIndex(null);
    };
    const onAlt = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || document.querySelector('[aria-modal="true"]')) return;
      const index = items.findIndex((item) => !item.disabled && item.mnemonicIndex !== undefined
        && item.label[item.mnemonicIndex]?.toLowerCase() === event.key.toLowerCase());
      if (index < 0) return;
      event.preventDefault();
      triggers.current[index]?.focus();
      open(index, "first");
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onAlt);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", onAlt);
    };
  }, [items, open]);

  const activate = (action: MenuBarAction) => {
    if (action.disabled) return;
    close(true);
    action.onClick();
  };

  const onKeyDown = (event: KeyboardEvent, index: number, inMenu: boolean) => {
    if (event.key === "Tab") {
      close();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      let next = index;
      for (let count = 0; count < items.length; count++) {
        next = (next + direction + items.length) % items.length;
        if (!items[next].disabled) break;
      }
      setFocusIndex(next);
      triggers.current[next]?.focus();
      if (openIndex !== null || inMenu) open(next, inMenu ? "first" : false);
      return;
    }
    if (!inMenu && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      open(index, event.key === "ArrowUp" ? "last" : "first");
      return;
    }
    if (inMenu && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const commands = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const selected = commands.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? commands.length - 1
        : (selected + (event.key === "ArrowDown" ? 1 : -1) + commands.length) % commands.length;
      commands[next]?.focus();
      return;
    }
    if (inMenu && event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const action = items[index].entries.find((entry) => !("separator" in entry) && !entry.disabled
        && entry.mnemonicIndex !== undefined && entry.label[entry.mnemonicIndex]?.toLowerCase() === event.key.toLowerCase());
      if (action && !("separator" in action)) {
        event.preventDefault();
        activate(action);
      }
    }
  };

  return (
    <div ref={bar} role="menubar" aria-label={label} className={styles.bar}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}>
      {items.map((item, index) => (
        <div key={item.label} role="none" className={styles.group}>
          <button
            ref={(element) => { triggers.current[index] = element; }}
            id={`${id}-trigger-${index}`}
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={openIndex === index}
            aria-controls={openIndex === index ? `${id}-menu-${index}` : undefined}
            disabled={item.disabled}
            tabIndex={focusIndex === index ? 0 : -1}
            onFocus={() => setFocusIndex(index)}
            onClick={() => openIndex === index ? close() : open(index)}
            onMouseEnter={() => {
              if (openIndex !== null && !item.disabled) {
                triggers.current[index]?.focus();
                open(index);
              }
            }}
            onKeyDown={(event) => onKeyDown(event, index, false)}
            className={clsx(styles.item, openIndex === index && styles.itemOpen)}
          >
            {mnemonic(item.label, item.mnemonicIndex)}
          </button>
          {openIndex === index && (
            <div id={`${id}-menu-${index}`} role="menu" data-menu-index={index} aria-labelledby={`${id}-trigger-${index}`}
              ref={(element) => {
                if (element && pendingFocus.current) {
                  focusCommand(element, pendingFocus.current);
                  pendingFocus.current = false;
                }
              }}
              className={styles.popup} onKeyDown={(event) => onKeyDown(event, index, true)}>
              {item.entries.map((entry, entryIndex) => "separator" in entry
                ? <div key={entryIndex} role="separator" className={styles.separator} />
                : <button key={entry.label} type="button" role="menuitem" tabIndex={-1}
                    disabled={entry.disabled} className={styles.command}
                    onMouseEnter={(event) => event.currentTarget.focus()}
                    onClick={() => activate(entry)}>
                    <span className={styles.icon} aria-hidden="true">{entry.icon}</span>
                    <span>{mnemonic(entry.label, entry.mnemonicIndex)}</span>
                  </button>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MenuBar;
