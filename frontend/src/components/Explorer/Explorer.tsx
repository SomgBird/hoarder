import { Frame, TitleBar } from "@react95/core";

import {
  Separator,
  AddressBar,
  ContentFrame,
  ItemView,
  EtchedBox,
} from "@components";
import { HtmlPage, Ie } from "@react95/icons";
import styles from "./Explorer.module.css";
import ExplorerToolbar from "./ExplorerToolbar";
import { ExplorerMenuBar } from "./ExplorerMenuBar";

interface ExplorerProps {
  id: number | null;
}

function Explorer({ id }: ExplorerProps) {
  return (
    <Frame bgColor="$material" boxShadow="$out" padding="$2" className={styles.explorer}>
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
          value={"Test URL"}
          onChange={() => {}}
          onSubmit={() => {}}
          icon={<HtmlPage variant="16x16_8" />}
        />
      </EtchedBox>

    <Frame bgColor="$material" className={styles.outer_content_wrapper}>
      <Frame boxShadow="$in" className={styles.inner_content_wrapper}>
          <ContentFrame>
            <ItemView id={id} />
          </ContentFrame>
        </Frame>
      </Frame>
    </Frame>
  );
}

export default Explorer;
