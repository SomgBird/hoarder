import { Button } from "@react95/core";
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
        <Icon name="search" />
        <span>Search</span>
      </Button>
      <Button className={styles.toolbarButton}>
        <Icon name="star" />
        <span>Favorites</span>
      </Button>

      <Separator orientation="vertical" className={styles.toolbarSeparator} />

      <Button className={styles.toolbarButton}>
        <Icon name="printer" />
      </Button>

      <Separator orientation="vertical" className={styles.toolbarSeparator} />

      <Button className={styles.toolbarButton}>
        <Icon name="question_mark" />
      </Button>
    </div>
  );
}

export default ExplorerToolbar;
