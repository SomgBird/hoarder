import { useEffect, useState } from "react";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import Explorer from "./components/Explorer/Explorer";

function App() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = "#008080";
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <ControlPanel
        selectedItemId={selectedItemId}
        onSelectItem={setSelectedItemId}
      />
      <Explorer id={selectedItemId} />
    </div>
  );
}

export default App;
