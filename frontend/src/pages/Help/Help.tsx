import { useState } from "react";
import { Frame, TitleBar } from "@react95/core";
import { HelpBook } from "@react95/icons";
import { HELP_GROUPS } from "@config/help";
import { HelpArticle } from "./HelpArticle";
import { HelpContents } from "./HelpContents";
import { HelpControls } from "./HelpControls";
import { useHelpNavigation } from "./useHelpNavigation";
import styles from "./Help.module.css";

export default function Help() {
  const navigation = useHelpNavigation();
  const { page, group, title, standalone, showPage, close } = navigation;
  const [contentsVisible, setContentsVisible] = useState(true);
  const status = page.kind === "topic" ? title
    : group ? `${group.topics.length} topics` : `${HELP_GROUPS.length} folders`;

  return (
    <Frame data-help-window className={styles.window} bgColor="$material" boxShadow="$out" padding="$3">
      <TitleBar title="Hoarder Help" icon={<HelpBook variant="16x16_4" />}>
        <TitleBar.OptionsBox><TitleBar.Close type="button" aria-label="Close Help" onClick={close} /></TitleBar.OptionsBox>
      </TitleBar>
      <HelpControls navigation={navigation} contentsVisible={contentsVisible}
        onToggleContents={() => setContentsVisible((visible) => !visible)} />
      <div className={styles.panes} data-contents-visible={contentsVisible}>
        {contentsVisible && <Frame as="aside" id="help-contents" className={styles.contents} aria-label="Help contents"
          bgColor="$material" boxShadow="$in">
          <Frame className={styles.contentsHeader} bgColor="$material" boxShadow="$out">
            <span>All topics</span>
            <TitleBar.Close type="button" aria-label="Close contents" onClick={() => setContentsVisible(false)} />
          </Frame>
          <div className={styles.treePanel}><HelpContents page={page} onSelect={showPage} /></div>
        </Frame>}
        <HelpArticle page={page} standalone={standalone} onNavigate={showPage} />
      </div>
      <Frame className={styles.status} boxShadow="$in" role="status">{status}</Frame>
    </Frame>
  );
}
