import { Button, Frame, TitleBar } from "@react95/core";
import { useEffect, type ReactElement, type ReactNode } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  titlebar_icon?: ReactElement;
  icon?: ReactElement;
  confirmLabel?: string;
  dismissLabel?: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ConfirmDialog({
  title,
  message,
  titlebar_icon,
  icon,
  confirmLabel = "Yes",
  dismissLabel = "No",
  onConfirm,
  onDismiss,
}: ConfirmDialogProps) {
  // Esc = dismiss, like a real Windows dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div className={styles.overlay}>
      <Frame
        bgColor="$material"
        boxShadow="$out"
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <TitleBar icon={titlebar_icon} title={title} />
        <div className={styles.body}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <div>{message}</div>
        </div>
        <div className={styles.buttons}>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
          {/* Safe default: focus the non-destructive button */}
          <Button onClick={onDismiss} autoFocus>
            {dismissLabel}
          </Button>
        </div>
      </Frame>
    </div>
  );
}
