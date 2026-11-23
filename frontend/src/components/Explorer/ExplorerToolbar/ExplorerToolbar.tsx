import { Icon, Separator, Toolbar } from "@components";
import { openHelp } from "@config/help";
import {
  Files,
  Progman44,
  Progman45,
  Shell32134,
  Shell3217,
  Winhlp324001,
  Wmsui323934,
  Write1,
} from "@react95/icons";
import { useNavigate } from "react-router-dom";
import { useExplorer } from "../ExplorerContext";
import { pageEditorPath } from "../locations";
import styles from "./ExplorerToolbar.module.css";

function ExplorerToolbar() {
  const { back, forward, canBack, canForward, navigate, current, refresh } = useExplorer();
  const navigateTo = useNavigate();
  const editorPath = pageEditorPath(current);

  return (
    <div className={styles.container}>
      <Separator orientation="vertical" variant="grip" />
      <Toolbar aria-label="Explorer commands" className={styles.commands}>
        <Toolbar.Button
          icon={<Progman44 variant="32x32_4" />}
          label="Back"
          onClick={back}
          disabled={!canBack}
        />
        <Toolbar.Button
          icon={<Progman45 variant="32x32_4" />}
          title="Forward" aria-label="Forward"
          onClick={forward}
          disabled={!canForward}
        />
        <Toolbar.Button icon={<Icon name="stop" />} title="Stop" aria-label="Stop" disabled />
        <Toolbar.Button icon={<Icon name="refresh_page" />} title="Refresh" aria-label="Refresh" onClick={refresh} />
        <Toolbar.Button
          icon={<Icon name="home" />}
          title="Home" aria-label="Home"
          onClick={() => navigate({ page: "home" })}
        />

        <Toolbar.Separator />

        <Toolbar.Button icon={<Shell32134 variant="32x32_4" />} label="Search" disabled />
        <Toolbar.Button icon={<Wmsui323934 variant="32x32_4" />} label="Favorites" disabled />

        <Toolbar.Separator />

        <Toolbar.Button icon={<Shell3217 variant="32x32_4" />} aria-label="Unassigned command" disabled />
        <Toolbar.Button
          icon={<Write1 variant="32x32_4" />}
          label="Edit"
          disabled={!editorPath}
          onClick={() => {
            if (editorPath) navigateTo(editorPath);
          }}
        />

        <Toolbar.Button
          icon={<Files variant="32x32_4" />}
          label="Copies"
          title="Edit copies of this item"
          disabled={current.page !== "item"}
          onClick={() => {
            if (current.page === "item") navigateTo(`/copy-editor?itemId=${current.id}`);
          }}
        />

        <Toolbar.Separator />

        <Toolbar.Button
          icon={<Winhlp324001 variant="32x32_4" />}
          label="Help"
          onClick={() => openHelp("explorer")}
        />
      </Toolbar>
    </div>
  );
}

export default ExplorerToolbar;
