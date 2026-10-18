import { Wizard } from "@components/Wizard/Wizard";
import { Mshtml32541 } from "@react95/icons";

export function PageEditor() {
  return (
    <Wizard
      title="Page Editor Wizard"
      icon={<Mshtml32541 variant="16x16_4" />}
      text="You can use this wizard to create and edit pages for your collection. Follow the steps to customize your page layout, add content, and configure settings."
    />
  );
}
