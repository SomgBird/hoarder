// src/components/Separator.tsx
import type { CSSProperties } from "react";

type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  variant?: "etched" | "grip";
  style?: CSSProperties;
  className?: string;
};

function Separator({
  orientation = "horizontal",
  variant = "etched",
  style,
  className,
}: SeparatorProps) {
  if (variant === "grip") {
    const gripStyle: CSSProperties = {
      flexShrink: 0,
      alignSelf: "stretch",
      width: 4,
      margin: "2px 4px 2px 2px",
      boxSizing: "border-box",
      borderTop: "1px solid var(--r95-color-borderLightest)",
      borderLeft: "1px solid var(--r95-color-borderLightest)",
      borderBottom: "1px solid var(--r95-color-borderDark)",
      borderRight: "1px solid var(--r95-color-borderDark)",
    };
    return <div className={className} style={{ ...gripStyle, ...style }} />;
  }

  const baseStyle: CSSProperties =
    orientation === "vertical"
      ? {
          width: 0,
          height: "auto",
          alignSelf: "stretch",
          borderLeft: "1px solid var(--r95-color-borderDark)",
          borderRight: "1px solid var(--r95-color-borderLightest)",
          borderTop: "none",
          borderBottom: "none",
          margin: "0 6px",
        }
      : {
          width: "100%",
          height: 0,
          borderTop: "1px solid var(--r95-color-borderDark)",
          borderBottom: "1px solid var(--r95-color-borderLightest)",
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
