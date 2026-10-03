import { useContext } from "react";
import clsx from "clsx";
import { Button } from "@react95/core";
import { ToolbarContext, type LabelPosition } from "./ToolbarContext";
import styles from "./Toolbar.module.css";

type Props = Omit<React.ComponentProps<typeof Button>, "children"> &
  (
    | { icon: React.ReactNode; label?: string }
    | { icon?: React.ReactNode; label: string }
  ) & {
    labelPosition?: LabelPosition;
  };

export function ToolbarButton({
  icon,
  label,
  labelPosition,
  className,
  ...rest
}: Props) {
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
      {label && <span>{label}</span>}
    </Button>
  );
}
