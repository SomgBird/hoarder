import { useEffect } from "react";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import Explorer from "./components/Explorer/Explorer";
import { BookList } from "./components/BookList";

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
      <BookList />
    </div>
  );
}

export default App;
