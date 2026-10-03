import { Button } from "@react95/core";
import {
  Progman44,
  Progman45,
  Wmsui322226,
  Mshtml32528,
  Shdocvw260,
  Progman37,
  Printer,
} from "@react95/icons";
import Separator from "../Separator";

import styles from "./ExplorerToolbar.module.css";

function ExplorerToolbar() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Button className={styles.toolbarButton}>
          <Progman44 variant="32x32_4" />
          <br />
          Back
        </Button>
        <Button className={styles.toolbarButton}>
          <Progman45 variant="32x32_4" />
          <br />
          Forward
        </Button>
        <Button className={styles.toolbarButton}>
          <Wmsui322226 variant="32x32_4" />
          <br />
          Refresh
        </Button>

        <Separator orientation="vertical" />
        <Button className={styles.toolbarButton}>
          <Mshtml32528 variant="32x32_8" />
          <br />
          Search
        </Button>
        <Button className={styles.toolbarButton}>
          <Shdocvw260 variant="32x32_4" />
          <br />
          Favorites
        </Button>

        <Separator orientation="vertical" />
        <Button className={styles.toolbarButton}>
          <Printer variant="32x32_4" />
          <br />
          Print
        </Button>
        <Button className={styles.toolbarButton}>
          <Progman37 variant="32x32_4" />
          <br />
          Help
        </Button>
      </div>
    </div>
  );
}

export default ExplorerToolbar;
