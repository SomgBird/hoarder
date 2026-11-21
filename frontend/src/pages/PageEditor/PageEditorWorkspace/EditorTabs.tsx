import { Addrbook, FileFont, FileText, FolderFile, Wangimg128 } from "@react95/icons";
import type { ReactNode } from "react";
import { PropertyPanel, PropertyTabs } from "@components/PropertyTabs/PropertyTabs";
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
  return <PropertyTabs label="Item properties" prefix="editor" sections={sections} active={active} onSelect={onSelect} />;
}

export function EditorPanel({ title, active, children }: { title: EditorSection; active: EditorSection; children: ReactNode }) {
  return <PropertyPanel prefix="editor" title={title} active={active} className={styles.panel}>{children}</PropertyPanel>;
}
