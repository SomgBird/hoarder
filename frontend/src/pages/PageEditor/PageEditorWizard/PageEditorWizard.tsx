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

export function PageEditorWizard() {
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState("");

  // All wizard data in one object, changed through `update`
  const [data, setData] = useState<PageData>({
    pageType: "franchise",
    title: "",
  });
  const update = (changes: Partial<PageData>) =>
    setData({ ...data, ...changes });

  // Each step is now one short entry: title, component, optional rule
  const stepProps = { data, update };

  const steps: WizardStep[] = [
    { title: "Page type", content: <TypeStep {...stepProps} /> },
    {
      title: "Details",
      content: <DetailsStep {...stepProps} />,
      validate: () => (data.title.trim() ? null : "Title is required."),
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
            onFinish={() => {
              setResult(JSON.stringify(data, null, 2));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            confirmCancel={false}
          />
        </div>
      )}
    </div>
  );
}
