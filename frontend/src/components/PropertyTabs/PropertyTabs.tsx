import type { ComponentType, KeyboardEvent, ReactNode } from "react";
import styles from "./PropertyTabs.module.css";

interface Props<T extends string> {
  prefix: string;
  label: string;
  sections: readonly { title: T; icon: ComponentType<{ variant: "16x16_4" }> }[];
  active: T;
  onSelect: (section: T) => void;
  focusOnMount?: boolean;
}

export function PropertyTabs<T extends string>({ prefix, label, sections, active, onSelect, focusOnMount }: Props<T>) {
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = sections.length - 1;
    const next = { ArrowRight: (index + 1) % sections.length, ArrowLeft: (index + last) % sections.length,
      Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(sections[next].title);
    event.currentTarget.parentElement?.querySelectorAll("button")[next]?.focus();
  }

  return <div role="tablist" aria-label={label} className={styles.tabs}>
    {sections.map(({ title, icon: Icon }, index) => <button key={title} type="button" role="tab" autoFocus={focusOnMount && active === title}
      id={`${prefix}-tab-${title}`} aria-controls={`${prefix}-panel-${title}`} aria-selected={active === title}
      tabIndex={active === title ? 0 : -1} onKeyDown={(event) => navigate(event, index)} onClick={() => onSelect(title)}>
      <Icon variant="16x16_4" aria-hidden="true" />{title}
    </button>)}
  </div>;
}

export function PropertyPanel({ prefix, title, active, className, children }: {
  prefix: string; title: string; active: string; className?: string; children: ReactNode;
}) {
  return <div id={`${prefix}-panel-${title}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${title}`}
    className={className} hidden={active !== title}>
    {children}
  </div>;
}
