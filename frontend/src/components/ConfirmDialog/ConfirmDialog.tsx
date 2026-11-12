import { Button, Frame, TitleBar } from "@react95/core";
import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  titlebar_icon?: ReactElement;
  icon?: ReactElement;
  confirmLabel?: string;
  dismissLabel?: string;
  busy?: boolean;
  confirmDisabled?: boolean;
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
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onDismiss,
}: ConfirmDialogProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const dismissButton = useRef<HTMLButtonElement>(null);
  const messageId = useId();
  const [previousFocus] = useState(() => document.activeElement as HTMLElement | null);
  useEffect(() => {
    dismissButton.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [previousFocus]);

  // Esc = dismiss, like a real Windows dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busy) onDismiss();
      }
      if (e.key === "Tab") {
        const controls = [...(overlay.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? [])];
        const first = controls[0];
        const last = controls.at(-1);
        if (!first || (e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)
          || !overlay.current?.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss, busy]);

  return (
    <div ref={overlay} className={styles.overlay}>
      <Frame
        bgColor="$material"
        boxShadow="$out"
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={messageId}
        aria-busy={busy}
      >
        <TitleBar icon={titlebar_icon} title={title} />
        <div className={styles.body}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <div id={messageId}>{message}</div>
        </div>
        <div className={styles.buttons}>
          <Button onClick={onConfirm} disabled={busy || confirmDisabled}>{confirmLabel}</Button>
          {/* Safe default: focus the non-destructive button */}
          <Button ref={dismissButton} onClick={onDismiss} disabled={busy} autoFocus>
            {dismissLabel}
          </Button>
        </div>
      </Frame>
    </div>
  );
}
