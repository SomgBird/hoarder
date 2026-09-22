import ControlPanel from "./components/ControlPanel/ControlPanel";
import Explorer from "./components/Explorer/Explorer";

function App() {
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <ControlPanel />
      <Explorer />
    </div>
  );
}

export default App;
