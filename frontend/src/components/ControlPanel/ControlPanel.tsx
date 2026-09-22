import { Frame, TitleBar } from "@react95/core";
import { Notepad } from "@react95/icons";

function ControlPanel() {
  return (
    <>
      <Frame w="500px" bgColor="$material" boxShadow="$out" padding="$3">
        <TitleBar
          title="Collection Manager"
          icon={<Notepad variant="16x16_4" />}
        >
          <TitleBar.OptionsBox>
            <TitleBar.Help />
            <TitleBar.Minimize />
            <TitleBar.Maximize />
            <TitleBar.Close />
          </TitleBar.OptionsBox>
        </TitleBar>
      </Frame>
    </>
  );
}

export default ControlPanel;
