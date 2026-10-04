import MenuBar from "@components/MenuBar/MenuBar";
import Separator from "@components/Separator";
import styles from "./ExplorerMenuBar.module.css";

export function ExplorerMenuBar() {
  return (
    <div className={styles.container}>
      <Separator orientation="vertical" variant="grip" />
      <MenuBar
        items={[
          { label: "File", mnemonicIndex: 0 },
          { label: "Edit", mnemonicIndex: 0 },
          { label: "View", mnemonicIndex: 0 },
          { label: "Favorites", mnemonicIndex: 0 },
          { label: "Tools", mnemonicIndex: 0 },
          { label: "Help", mnemonicIndex: 0 },
        ]}
      />
    </div>
  );
}
