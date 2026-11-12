import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mshtml32541, Progman44, Progman45, RecycleEmpty, Winhlp324000, Write1 } from "@react95/icons";
import { Icon } from "@components/Icon/Icon";
import MenuBar from "@components/MenuBar/MenuBar";
import Separator from "@components/Separator";
import { useExplorer } from "../ExplorerContext";
import { DeleteItemDialog } from "./DeleteItemDialog";
import styles from "./ExplorerMenuBar.module.css";

export function ExplorerMenuBar() {
  const { current, back, forward, canBack, canForward, navigate, refresh, removeItem } = useExplorer();
  const navigateTo = useNavigate();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const isItem = current.page === "item";

  return (
    <>
    <div className={styles.container}>
      <Separator orientation="vertical" variant="grip" />
      <MenuBar
        items={[
          { label: "File", mnemonicIndex: 0, entries: [
            { label: "New page…", mnemonicIndex: 0, icon: <Mshtml32541 variant="16x16_4" />, onClick: () => navigateTo("/page-editor") },
            { separator: true },
            { label: "Delete item…", mnemonicIndex: 0, icon: <RecycleEmpty variant="16x16_4" />, disabled: !isItem,
              onClick: () => { if (current.page === "item") setDeleteId(current.id); } },
          ] },
          { label: "Edit", mnemonicIndex: 0, entries: [
            { label: "Edit page…", mnemonicIndex: 0, icon: <Write1 variant="16x16_4" />, disabled: !isItem,
              onClick: () => { if (current.page === "item") navigateTo(`/page-editor?itemId=${current.id}`); } },
          ] },
          { label: "View", mnemonicIndex: 0, entries: [
            { label: "Refresh", mnemonicIndex: 0, icon: <Icon name="refresh_page" size={16} />, onClick: refresh },
          ] },
          { label: "Go", mnemonicIndex: 0, entries: [
            { label: "Back", mnemonicIndex: 0, icon: <Progman44 variant="32x32_4" width={16} height={16} />, disabled: !canBack, onClick: back },
            { label: "Forward", mnemonicIndex: 0, icon: <Progman45 variant="32x32_4" width={16} height={16} />, disabled: !canForward, onClick: forward },
            { separator: true },
            { label: "Home", mnemonicIndex: 0, icon: <Icon name="home" size={16} />, onClick: () => navigate({ page: "home" }) },
          ] },
          { label: "Help", mnemonicIndex: 0, entries: [
            { label: "About Hoarder…", mnemonicIndex: 0, icon: <Winhlp324000 variant="16x16_4" />, onClick: () => navigateTo("/") },
          ] },
        ]}
      />
    </div>
    {deleteId !== null && <DeleteItemDialog key={deleteId} id={deleteId} onDismiss={() => setDeleteId(null)}
      onDeleted={(id) => {
        removeItem(id);
        setDeleteId(null);
        navigateTo("/collection-view", { replace: true });
      }} />}
    </>
  );
}
