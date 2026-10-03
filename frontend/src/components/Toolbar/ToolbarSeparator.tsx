import clsx from "clsx";
import Separator from "../Separator";
import styles from "./Toolbar.module.css";

type Props = Omit<React.ComponentProps<typeof Separator>, "orientation">;

export function ToolbarSeparator({ className, ...rest }: Props) {
  return (
    <Separator
      orientation="vertical"
      className={clsx(styles.toolbarSeparator, className)}
      {...rest}
    />
  );
}
