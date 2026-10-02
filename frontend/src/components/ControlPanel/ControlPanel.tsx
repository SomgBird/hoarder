import { useState, useEffect } from "react";
import { Frame, TitleBar } from "@react95/core";
import { Notepad } from "@react95/icons";
import type { ItemInfo } from "@types";
import { itemService } from "../../services/itemService";

interface Props {
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
}

function ControlPanel({ selectedItemId, onSelectItem }: Props) {
  const [items, setItems] = useState<ItemInfo[]>([]);

  useEffect(() => {
    itemService
      .list()
      .then((page) => setItems(page.items))
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
              aria-current={item.id === selectedItemId}
              onClick={() => onSelectItem(item.id)}
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
              <span>{item.authors.map((a) => a.name).join(", ")}</span>
            </div>
          ))}
        </Frame>
      </Frame>
    </>
  );
}

export default ControlPanel;
