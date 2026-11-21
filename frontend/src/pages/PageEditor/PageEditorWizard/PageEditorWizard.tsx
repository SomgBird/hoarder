import type { WizardStep } from "@components/Wizard/wizardTypes";
import { Wizard } from "@components/Wizard/Wizard";
import { Button } from "@react95/core";
import { FilePen } from "@react95/icons";
import { useState } from "react";
import { PageEditorWindow } from "../PageEditorWindow";
import styles from "../PageEditor.module.css";
import type { PageData } from "../pageTypes";
import {
  DetailsStep,
  NotImplementedStep,
  ReviewStep,
  TypeStep,
} from "./PageEditorWizardSteps";

const INITIAL_DATA: PageData = { pageType: "item", title: "", itemType: null };

interface PageEditorWizardProps {
  onFinish: (data: PageData) => void;
}

export function PageEditorWizard({ onFinish }: PageEditorWizardProps) {
  const [open, setOpen] = useState(true);
  const [data, setData] = useState<PageData>(INITIAL_DATA);

  const update = (changes: Partial<PageData>) =>
    setData((prev) => ({ ...prev, ...changes }));

  const cancelWizard = () => {
    setData(INITIAL_DATA);
    setOpen(false);
  };

  const stepProps = { data, update };

  const steps: WizardStep[] = [
    { title: "Page type", content: <TypeStep {...stepProps} /> },
    ...(data.pageType === "item"
      ? [
          {
            title: "Details",
            content: <DetailsStep {...stepProps} />,
            validate: () => {
              if (!data.title.trim()) return "Title is required.";
              if (!data.itemType) return "Item type is required.";
              return null;
            },
          },
          { title: "Review", content: <ReviewStep {...stepProps} /> },
        ]
      : [
          {
            title: "Not available",
            content: <NotImplementedStep {...stepProps} />,
            nextDisabled: true,
          },
        ]),
  ];

  if (!open) return <PageEditorWindow>
    <div className={styles.message}>
      <Button className={styles.launch} onClick={() => setOpen(true)}>
        <FilePen variant="16x16_4" aria-hidden="true" />New page…
      </Button>
    </div>
  </PageEditorWindow>;

  return <Wizard title="New Page Wizard" helpTopic="new-item" icon={<FilePen variant="16x16_4" />}
    illustration={<FilePen variant="32x32_4" width={64} height={64} aria-hidden="true" />}
    steps={steps} showImage showSteps onFinish={() => onFinish(data)} onCancel={cancelWizard} confirmCancel />;
}
