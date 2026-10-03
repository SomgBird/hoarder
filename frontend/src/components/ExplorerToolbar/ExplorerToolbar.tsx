import { Button } from "@react95/core";
import { Shdocvw260, Progman37, Printer, FileFind2 } from "@react95/icons";
import Separator from "../Separator";

import styles from "./ExplorerToolbar.module.css";
import { Icon } from "@components/Icon/Icon";

function ExplorerToolbar() {
  return (
    <div className={styles.toolbar}>
      <Button className={styles.toolbarButton}>
        <Icon name="back" />
        <span>Back</span>
      </Button>
      <Button className={styles.toolbarButton}>
        <Icon name="forward" />
      </Button>
      <Button className={styles.toolbarButton}>
        <Icon name="stop" />
      </Button>
      <Button className={styles.toolbarButton}>
        <Icon name="refresh" />
      </Button>

      <Separator orientation="vertical" className={styles.toolbarSeparator} />

      <Button className={styles.toolbarButton}>
        <FileFind2 variant="32x32_4" />
        <span>Search</span>
      </Button>
      <Button className={styles.toolbarButton}>
        <Shdocvw260 variant="32x32_4" />
        <span>Favorites</span>
      </Button>

      <Separator orientation="vertical" className={styles.toolbarSeparator} />

      <Button className={styles.toolbarButton}>
        <Printer variant="32x32_4" />
      </Button>

      <Separator orientation="vertical" className={styles.toolbarSeparator} />

      <Button className={styles.toolbarButton}>
        <Progman37 variant="32x32_4" />
      </Button>
    </div>
  );
}

export default ExplorerToolbar;
