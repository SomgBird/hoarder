import type { WizardStep } from "@components/Wizard/types";
import { Wizard } from "@components/Wizard/Wizard";
import { Button } from "@react95/core";
import { Mshtml32541 } from "@react95/icons";
import { useState } from "react";
import {
  DetailsStep,
  ReviewStep,
  TypeStep,
  type PageData,
} from "./PageEditorWizardSteps";

const BANNER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="290">' +
      '<rect width="150" height="290" fill="#008080"/>' +
      '<rect x="25" y="40" width="100" height="70" fill="#c0c0c0" stroke="#000"/>' +
      '<rect x="25" y="40" width="100" height="12" fill="#000080"/>' +
    '</svg>',
  );

const INITIAL_DATA: PageData = {
  pageType: "item",
  title: "",
  itemType: null,
};

export function PageEditorWizard() {
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState("");

  // All wizard data in one object, changed through `update`
  const [data, setData] = useState<PageData>({
    pageType: "item",
    title: "",
    itemType: null 
  });

  const closeWizard = () => {
    setData(INITIAL_DATA);
    setOpen(false);
  };

  const update = (changes: Partial<PageData>) =>
    setData((prev) => ({ ...prev, ...changes }));

  // Each step is now one short entry: title, component, optional rule
  const stepProps = { data, update };



  const steps: WizardStep[] = [
    { title: "Page type", content: <TypeStep {...stepProps} /> },
    {
      title: "Details",
      content: <DetailsStep {...stepProps} />,
      validate: () => { 
        if (!data.title.trim()) return "Title is required."
        if (!data.itemType) return "Item type is requiered."
        return null;
      },
    },
    { title: "Review", content: <ReviewStep {...stepProps} /> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setOpen(true)}>New page...</Button>
      {result && <pre>{result}</pre>}
      {open && (
        <div style={{ marginTop: 16 }}>
          <Wizard
            title="New page"
            icon={<Mshtml32541 variant="16x16_4" />}
            steps={steps}
            imageSrc={BANNER}
            showImage={true}
            showSteps={true}
            onFinish={() => { setResult(JSON.stringify(data, null, 2)); closeWizard(); }}
            onCancel={closeWizard}
            confirmCancel={true}
          />
        </div>
      )}
    </div>
  );
}
