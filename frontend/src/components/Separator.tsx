// src/components/Separator.jsx
function Separator({ orientation = "horizontal" }) {
  const baseStyle =
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

  return <hr style={{ border: "none", ...baseStyle }} />;
}

export default Separator;
