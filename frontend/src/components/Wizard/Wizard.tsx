import Separator from "@components/Separator";
import { Button, Frame, TitleBar } from "@react95/core";
import styles from "./Wizard.module.css";
import type { WizardProps } from "./types";
import { useState } from "react";
import { WizardBanner } from "./WizardBanner";
import { WizardStepList } from "./WizardStepList";
import { ConfirmDialog } from "@components";
import { Icwdial101 } from "@react95/icons";

export function Wizard({
  title,
  icon,
  imageSrc,
  showImage,
  showSteps,
  onFinish,
  onCancel,
  confirmCancel,
  steps,
}: WizardProps) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const step = steps[index];
  const isFirstStep = index === 0;
  const isLastStep = index === steps.length - 1;

  const handleCancel = () => {
    if (confirmCancel) setConfirmingCancel(true);
    else onCancel();
  };

  const confirmCancelYes = () => {
    setConfirmingCancel(false);
    onCancel();
  };

  const goNext = () => {
    // Stay on this step if validation fails
    const message = step.validate?.() ?? null;
    if (message) {
      setError(message);
      return;
    }
    setError("");
    if (isLastStep) onFinish();
    else setIndex(index + 1);
  };

  const goBack = () => {
    setError("");
    setIndex(index - 1);
  };

  return (
    <>
      <Frame
        bgColor="$material"
        boxShadow="$out"
        className={styles.wizard_frame}
      >
        <TitleBar icon={icon} title={title}></TitleBar>
        <div className={styles.wizard_content_wrapper}>
          <div className={styles.wizard_inner_content_wrapper}>
            {showImage && <WizardBanner bannerImage={imageSrc} />}
            {showSteps && <WizardStepList steps={steps} currentIndex={index} />}

            {/* Content column: heading, step content */}
            <div className={styles.content_column}>
              <h3 className={styles.step_title}>{step.title}</h3>
              <div
                className={styles.step_content}
                onChange={() => setError("")}
              >
                {step.content}
                {error && <div className={styles.error_text}>{error}</div>}
              </div>
            </div>
          </div>

          <Separator />
          <div className={styles.buttons_section}>
            <Button onClick={goBack} disabled={isFirstStep}>
              &lt; Back
            </Button>
            <Button onClick={goNext} disabled={step.nextDisabled}>{isLastStep ? "Finish" : "Next >"}</Button>
            <Button className={styles.cancel_button} onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </Frame>

      {confirmingCancel && (
        <ConfirmDialog
          title="Cancel wizard"
          message="Are you sure you want to cancel? All entered data will be lost."
          onConfirm={confirmCancelYes}
          onDismiss={() => setConfirmingCancel(false)}
          icon={<Icwdial101 variant="32x32_4" />}
        />
      )}
    </>
  );
}
