import { useEffect, useState } from "react";
import { Frame, TitleBar } from "@react95/core";
import { HtmlPage, Ie } from "@react95/icons";

import {
  Separator,
  AddressBar,
  ContentFrame,
  EtchedBox,
} from "@components";
import styles from "./Explorer.module.css";
import ExplorerToolbar from "./ExplorerToolbar";
import { ExplorerMenuBar } from "./ExplorerMenuBar";
import { useExplorer } from "./ExplorerContext";
import { parseUrl, toUrl } from "./locations";
import { renderPage } from "./explorer_pages";

function Explorer() {
  const { current, navigate } = useExplorer();

  // What's typed in the address bar before Enter; reset whenever we navigate.
  const [draft, setDraft] = useState(toUrl(current));
  useEffect(() => {
    setDraft(toUrl(current));
  }, [current]);

  return (
    <Frame
      bgColor="$material"
      boxShadow="$out"
      padding="$2"
      className={styles.explorer}
    >
      <TitleBar icon={<Ie variant="16x16_8" />} title="Explorer">
        <TitleBar.OptionsBox>
          <TitleBar.Close />
        </TitleBar.OptionsBox>
      </TitleBar>

      <EtchedBox>
        <ExplorerMenuBar />
        <Separator className={styles.explorer_separator} />
        <ExplorerToolbar />
        <Separator className={styles.explorer_separator} />
        <AddressBar
          value={draft}
          onChange={setDraft}
          onSubmit={() => navigate(parseUrl(draft))}
          icon={<HtmlPage variant="16x16_8" />}
        />
      </EtchedBox>

      <Frame bgColor="$material" className={styles.outer_content_wrapper}>
        <Frame boxShadow="$in" className={styles.inner_content_wrapper}>
          <ContentFrame>{renderPage(current)}</ContentFrame>
        </Frame>
      </Frame>
    </Frame>
  );
}

export default Explorer;