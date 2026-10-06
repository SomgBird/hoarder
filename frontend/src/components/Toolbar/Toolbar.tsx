import clsx from "clsx";
import { ToolbarContext, type LabelPosition } from "./ToolbarContext";
import styles from "./Toolbar.module.css";

type Props = React.ComponentProps<"div"> & {
  labelPosition?: LabelPosition; // default for every button in this toolbar
};

export function Toolbar({
  labelPosition = "right",
  className,
  ...rest
}: Props) {
  return (
    <ToolbarContext.Provider value={{ labelPosition }}>
      <div
        role="toolbar"
        className={clsx(styles.toolbar, className)}
        {...rest}
      />
    </ToolbarContext.Provider>
  );
}
