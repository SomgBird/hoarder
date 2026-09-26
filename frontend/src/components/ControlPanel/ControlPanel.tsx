import { useState, useEffect } from "react";
import { Frame, TitleBar } from "@react95/core";
import { Notepad } from "@react95/icons";
import type { Book } from "../../types";

function ControlPanel() {
  const [items, setItems] = useState<Book[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books")
      .then((res) => res.json())
      .then(setItems)
      .catch((err) => console.error("Failed to fetch items:", err));
  }, []);

  return (
    <>
      <Frame w="500px" bgColor="$material" boxShadow="$out" padding="$3">
        <TitleBar
          title="Collection Manager"
          icon={<Notepad variant="16x16_4" />}
        >
          <TitleBar.OptionsBox>
            <TitleBar.Help />
            <TitleBar.Minimize />
            <TitleBar.Maximize />
            <TitleBar.Close />
          </TitleBar.OptionsBox>
        </TitleBar>
        <Frame bgColor="$inputBackground" boxShadow="$in" padding="$2">
          {items.length === 0 && <p style={{ margin: 4 }}>No items yet.</p>}
          {items.map((item, i) => (
            <div
              key={item.id}
              //onClick={() => openItem(item.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 4px",
                cursor: "pointer",
                backgroundColor:
                  i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.04)",
              }}
            >
              <span>{item.title}</span>
              <span>{item.release_date}</span>
            </div>
          ))}
        </Frame>
      </Frame>
    </>
  );
}

export default ControlPanel;
