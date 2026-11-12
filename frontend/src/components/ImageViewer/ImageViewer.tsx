import { Button, Frame, TitleBar } from "@react95/core";
import { Wangimg128 } from "@react95/icons";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ImageViewer.module.css";

interface Props {
  src: string;
  name: string;
  onClose: () => void;
}

export function ImageViewer({ src, name, onClose }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [previousFocus] = useState(() => document.activeElement as HTMLElement | null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    closeButton.current?.focus();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [previousFocus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') ?? [])];
        const first = controls[0];
        const last = controls.at(-1);
        if (!dialog.current?.contains(document.activeElement)
          || (event.shiftKey && document.activeElement === first)
          || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay}>
      <Frame ref={dialog} className={styles.window} bgColor="$material" boxShadow="$out"
        role="dialog" aria-modal="true" aria-label={`Image: ${name}`}>
        <TitleBar title={name} icon={<Wangimg128 variant="16x16_4" />} className={styles.titlebar}>
          <TitleBar.OptionsBox>
            <TitleBar.Close ref={closeButton} type="button" aria-label="Close image" onClick={onClose} />
          </TitleBar.OptionsBox>
        </TitleBar>
        <Frame className={styles.viewport} bgColor="$inputBackground" boxShadow="$in" tabIndex={0} aria-label="Full size image">
          {error ? <div role="alert" className={styles.error}>
            <p>Could not load image.</p>
            <Button onClick={() => { setError(false); setAttempt((value) => value + 1); }}>Retry</Button>
          </div> : <img key={attempt} src={src} alt={name} className={styles.image} onError={() => setError(true)} />}
        </Frame>
        <div className={styles.status}>{name}</div>
      </Frame>
    </div>,
    document.body,
  );
}
