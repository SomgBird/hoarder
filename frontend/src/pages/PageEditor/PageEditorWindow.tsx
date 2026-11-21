import { Frame, TitleBar } from "@react95/core";
import { FilePen } from "@react95/icons";
import type { ReactNode } from "react";
import { HelpButton } from "@components/HelpButton/HelpButton";
import styles from "./PageEditor.module.css";

export function PageEditorWindow({ children, onClose, busy, editing, className = "" }: {
  children: ReactNode; onClose?: () => void; busy?: boolean; editing?: boolean; className?: string;
}) {
  return <Frame bgColor="$material" boxShadow="$out" className={`${styles.window} ${className}`}
    role="region" aria-label="Page Editor">
    <TitleBar className={styles.caption} title="Page Editor" icon={<FilePen variant="16x16_4" />}>
      <TitleBar.OptionsBox>
        <HelpButton topic={editing ? "edit-item" : "new-item"} />
        {onClose && <TitleBar.Close type="button" aria-label="Close Page Editor" disabled={busy} onClick={onClose} />}
      </TitleBar.OptionsBox>
    </TitleBar>
    {children}
  </Frame>;
}
