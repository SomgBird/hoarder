import { useEffect } from "react";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import Explorer from "./components/Explorer/Explorer";

function App() {
  useEffect(() => {
    document.body.style.backgroundColor = "#008080";
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        backgroundColor: "#008080",
      }}
    >
      <ControlPanel />
      <Explorer />
    </div>
  );
}

export default App;
