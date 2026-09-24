import type { ReactNode } from "react";
import styles from "./ContentFrame.module.css";

interface ContentFrameProps {
  children: ReactNode;
  className?: string;
}

export default function ContentFrame({
  children,
  className,
}: ContentFrameProps) {
  return (
    <div className={styles.scroll}>
      <div className={[styles.reset, className].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}
