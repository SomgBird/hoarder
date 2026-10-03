import { forwardRef, type ImgHTMLAttributes } from "react";
import { icons, type IconName } from "./icons";
import styles from "./Icon.module.css";

type NativeImgProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height"
>;

export interface IconProps extends NativeImgProps {
  name: IconName;
  /** Size in px (square). Default 32 (native PNG size). */
  size?: number;
  /** Accessible label. If omitted the icon is treated as decorative. */
  label?: string;
  className?: string;
}

export const Icon = forwardRef<HTMLImageElement, IconProps>(
  ({ name, size = 32, label, className, style, ...rest }, ref) => {
    const src = icons[name];

    return (
      <img
        ref={ref}
        src={src}
        width={size}
        height={size}
        alt={label ?? ""}
        aria-hidden={label ? undefined : true}
        role={label ? "img" : undefined}
        draggable={false}
        className={[styles.icon, className].filter(Boolean).join(" ")}
        style={{ width: size, height: size, ...style }}
        {...rest}
      />
    );
  },
);

Icon.displayName = "Icon";
