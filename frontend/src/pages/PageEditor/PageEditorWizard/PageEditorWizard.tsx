import type { WizardStep } from "@components/Wizard/wizardTypes";
import type { RecordPage } from "@components/Explorer/locations";
import { Wizard } from "@components/Wizard/Wizard";
import { Button } from "@react95/core";
import { FilePen } from "@react95/icons";
import { useState } from "react";
import { PageEditorWindow } from "../PageEditorWindow";
import styles from "../PageEditor.module.css";
import type { PageData } from "../pageTypes";
import { FranchiseStep } from "./FranchiseStep";
import {
  DetailsStep,
  NotImplementedStep,
  ReviewStep,
  TypeStep,
} from "./PageEditorWizardSteps";

interface PageEditorWizardProps {
  initialType?: RecordPage;
  onFinish: (data: PageData) => void;
}

export function PageEditorWizard({ initialType = "item", onFinish }: PageEditorWizardProps) {
  const [open, setOpen] = useState(true);
  const initialData: PageData = { pageType: initialType, title: "", itemType: null, franchise: null };
  const [data, setData] = useState<PageData>(initialData);

  const update = (changes: Partial<PageData>) =>
    setData((prev) => ({ ...prev, ...changes }));

  const cancelWizard = () => {
    setData(initialData);
    setOpen(false);
  };

  const stepProps = { data, update };

  const steps: WizardStep[] = [
    { title: "Page type", content: <TypeStep {...stepProps} /> },
    ...(data.pageType !== "custom"
      ? [
          {
            title: data.pageType === "franchise" ? "Franchise" : "Details",
            content: data.pageType === "franchise" ? <FranchiseStep {...stepProps} /> : <DetailsStep {...stepProps} />,
            validate: () => {
              if (data.pageType === "franchise") return data.franchise ? null : "Choose a franchise.";
              if (!data.title.trim()) return "Title is required.";
              if (data.pageType === "item" && !data.itemType) return "Item type is required.";
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
