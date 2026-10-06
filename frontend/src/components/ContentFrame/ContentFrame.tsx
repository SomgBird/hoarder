import type { ReactNode } from "react";
import styles from "./ContentFrame.module.css";

interface ContentFrameProps {
  children: ReactNode;
}

export default function ContentFrame({ children }: ContentFrameProps) {
  return (
    <div className={styles.scroll}>
      <div className={[styles.reset].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
