import { useState } from "react";
import ControlPanel from "../../components/ControlPanel/ControlPanel";
import Explorer from "../../components/Explorer/Explorer";
import "./Home.module.css";

export default function Home() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

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
