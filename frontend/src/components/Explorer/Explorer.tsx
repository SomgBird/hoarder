import { Frame, TitleBar } from "@react95/core";

import {
  MenuBar,
  Separator,
  AddressBar,
  ContentFrame,
  ItemView,
} from "@components";
import { HtmlPage, Ie } from "@react95/icons";
import styles from "./Explorer.module.css";
import ExplorerToolbar from "./ExplorerToolbar";

interface Props {
  id: number | null;
}

function Explorer({ id }: Props) {
  return (
    <Frame w="1200px" bgColor="$material" boxShadow="$out" padding="$2">
      <TitleBar icon={<Ie variant="16x16_8" />} title="Explorer">
        <TitleBar.OptionsBox>
          <TitleBar.Close />
        </TitleBar.OptionsBox>
      </TitleBar>
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
      <Separator className={styles.explorerSeparator} />
      <ExplorerToolbar />
      <Separator className={styles.explorerSeparator} />
      <AddressBar
        value={"Test URL"}
        onChange={() => {}}
        onSubmit={() => {}}
        icon={<HtmlPage variant="16x16_8" />}
      />
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
