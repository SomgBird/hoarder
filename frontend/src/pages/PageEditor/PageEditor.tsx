import { Wizard } from "@components/Wizard/Wizard";
import { Mshtml32541 } from "@react95/icons";

export function PageEditor() {
  return (
    <Wizard
      title="Page Editor Wizard"
      icon={<Mshtml32541 variant="16x16_4" />}
      onCancel={() => {}}
      confirmCancel={false}
      steps={[]}
      initialValues={{}}
      onFinish={() => {}}
    />
  );
}
