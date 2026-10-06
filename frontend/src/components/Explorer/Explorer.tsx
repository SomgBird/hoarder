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

interface Props {
  id: number | null;
}

function Explorer({ id }: Props) {
  return (
    <Frame bgColor="$material" boxShadow="$out" padding="$2">
      <TitleBar icon={<Ie variant="16x16_8" />} title="Explorer">
        <TitleBar.OptionsBox>
          <TitleBar.Close />
        </TitleBar.OptionsBox>
      </TitleBar>
      <EtchedBox>
        <ExplorerMenuBar />
        <Separator className={styles.explorerSeparator} />
        <ExplorerToolbar />
        <Separator className={styles.explorerSeparator} />
        <AddressBar
          value={"Test URL"}
          onChange={() => {}}
          onSubmit={() => {}}
          icon={<HtmlPage variant="16x16_8" />}
        />
      </EtchedBox>

      <Frame bgColor="$material" padding="$4">
        <Frame
          h="650px"
          bgColor="white"
          boxShadow="$in"
          paddingTop="$1"
          paddingLeft="$1"
        >
          <ContentFrame>
            <ItemView id={id} />
          </ContentFrame>
        </Frame>
      </Frame>
    </Frame>
  );
}

export default Explorer;
