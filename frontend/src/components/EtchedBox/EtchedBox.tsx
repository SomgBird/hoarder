import type { CSSProperties, ReactNode } from "react";
import styles from "./EtchedBox.module.css";

type EtchedBoxProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

function EtchedBox({ children, className, style }: EtchedBoxProps) {
  const classes = [styles.etchedBox, className].filter(Boolean).join(" ");

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

export default EtchedBox;
