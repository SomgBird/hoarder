// ToolbarButton.tsx
import { useContext } from "react";
import clsx from "clsx";
import { Button } from "@react95/core";
import { ToolbarContext, type LabelPosition } from "./ToolbarContext";
import styles from "./Toolbar.module.css";

export type ToolbarButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> &
  (
    | { icon: React.ReactNode; label?: string }
    | { icon?: React.ReactNode; label: string }
  ) & {
    labelPosition?: LabelPosition;
    arrow?: "down" | "right"; // small triangle after the label
  };

export function ToolbarButton({
  icon,
  label,
  labelPosition,
  arrow,
  className,
  ...rest
}: ToolbarButtonProps) {
  const ctx = useContext(ToolbarContext);

  return (
    <Button
      className={clsx(styles.toolbarButton, className)}
      data-label-position={labelPosition ?? ctx.labelPosition}
      {...rest}
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {(label || arrow) && (
        <span>
          {label}
          {arrow && (
            <span
              className={clsx(styles.arrow, styles[`arrow-${arrow}`])}
              aria-hidden="true"
            />
          )}
        </span>
      )}
    </Button>
  );
}
