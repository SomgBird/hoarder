// src/components/Separator.tsx
import type { CSSProperties } from "react";

type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  style?: CSSProperties;
  className?: string;
};

function Separator({
  orientation = "horizontal",
  style,
  className,
}: SeparatorProps) {
  const baseStyle: CSSProperties =
    orientation === "vertical"
      ? {
          width: 0,
          height: "auto",
          alignSelf: "stretch",
          borderLeft: "1px solid #808080",
          borderRight: "1px solid #ffffff",
          borderTop: "none",
          borderBottom: "none",
          margin: "0 6px",
        }
      : {
          width: "100%",
          height: 0,
          borderTop: "1px solid #808080",
          borderBottom: "1px solid #ffffff",
          borderLeft: "none",
          borderRight: "none",
          margin: "6px 0",
        };

  return (
    <hr
      className={className}
      style={{ border: "none", ...baseStyle, ...style }}
    />
  );
}

export default Separator;
