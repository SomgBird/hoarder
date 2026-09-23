import { Frame, TitleBar } from "@react95/core";
import { HtmlPage, Ie } from "@react95/icons";
import ExplorerToolbar from "./ExplorerToolbar";
import Separator from "../Separator";
import MenuBar from "../MenuBar/MenuBar";
import AddressBar from "../AddressBar/AddressBar";
import ContentFrame from "./ContentFrame";
import ItemView from "../ItemView/ItemView";

function Explorer() {
  return (
    <Frame w="800px" bgColor="$material" boxShadow="$out" padding="$2">
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
      <Separator />
      <ExplorerToolbar />
      <Separator />
      <AddressBar
        value={"Test URL"}
        onChange={() => {}}
        onSubmit={() => {}}
        icon={<HtmlPage variant="16x16_8" />}
      />
      <Frame bgColor="$material" padding="$4">
        <Frame h="500px" bgColor="white" boxShadow="$in" padding="$1">
          <ContentFrame>
            <ItemView />
          </ContentFrame>
        </Frame>
      </Frame>
    </Frame>
  );
}

export default Explorer;
