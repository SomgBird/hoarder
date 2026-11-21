import { Addrbook, FileFont, FileText, FolderFile, Wangimg128 } from "@react95/icons";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./PageEditorWorkspace.module.css";

const sections = [
  { title: "General", icon: FileText },
  { title: "Catalog", icon: FolderFile },
  { title: "Languages", icon: FileFont },
  { title: "Credits", icon: Addrbook },
  { title: "Images", icon: Wangimg128 },
] as const;

export type EditorSection = typeof sections[number]["title"];

export function EditorTabs({ active, onSelect }: { active: EditorSection; onSelect: (section: EditorSection) => void }) {
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = sections.length - 1;
    const next = { ArrowRight: (index + 1) % sections.length, ArrowLeft: (index + last) % sections.length,
      Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(sections[next].title);
    event.currentTarget.parentElement?.querySelectorAll("button")[next]?.focus();
  }

  return <div role="tablist" aria-label="Item properties" className={styles.tabs}>
    {sections.map(({ title, icon: Icon }, index) => <button key={title} type="button" role="tab"
      id={`editor-tab-${title}`} aria-controls={`editor-panel-${title}`} aria-selected={active === title}
      tabIndex={active === title ? 0 : -1} onKeyDown={(event) => navigate(event, index)} onClick={() => onSelect(title)}>
      <Icon variant="16x16_4" aria-hidden="true" />{title}
    </button>)}
  </div>;
}

export function EditorPanel({ title, active, children }: { title: EditorSection; active: EditorSection; children: ReactNode }) {
  // Keep pending file selections, searches and new-reference drafts when switching tabs.
  return <div id={`editor-panel-${title}`} role="tabpanel" aria-labelledby={`editor-tab-${title}`}
    className={styles.panel} hidden={active !== title}>
    {children}
  </div>;
}
