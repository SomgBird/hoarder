import Separator from "@components/Separator";
import { Button, Frame, TitleBar } from "@react95/core";
import styles from "./Wizard.module.css";
import type { WizardProps } from "./wizardTypes";
import { useState } from "react";
import { WizardBanner } from "./WizardBanner";
import { WizardStepList } from "./WizardStepList";
import { ConfirmDialog } from "@components";
import { Icwdial101 } from "@react95/icons";
import { HelpButton } from "@components/HelpButton/HelpButton";

export function Wizard({
  title,
  icon,
  imageSrc,
  illustration,
  showImage,
  showSteps,
  helpTopic = "welcome",
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
        role="region" aria-label={title} inert={confirmingCancel}
      >
        <TitleBar className={styles.caption} icon={icon} title={title}>
          <TitleBar.OptionsBox>
            <HelpButton topic={helpTopic} />
            <TitleBar.Close aria-label="Close wizard" onClick={handleCancel} />
          </TitleBar.OptionsBox>
        </TitleBar>
        <div className={styles.wizard_content_wrapper}>
          <div className={styles.wizard_inner_content_wrapper}>
            {(showImage || showSteps) && <WizardBanner bannerImage={showImage ? imageSrc : undefined}>
              {showImage && illustration}
              {showSteps && <WizardStepList steps={steps} currentIndex={index} />}
            </WizardBanner>}

            <div className={styles.content_column}>
              <h1 className={styles.step_title}>{step.title}</h1>
              <div onChange={() => setError("")}>
                {step.content}
                {error && <div role="alert" className={styles.error_text}>{error}</div>}
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
          helpTopic={helpTopic}
          message="Are you sure you want to cancel? All entered data will be lost."
          onConfirm={confirmCancelYes}
          onDismiss={() => setConfirmingCancel(false)}
          icon={<Icwdial101 variant="32x32_4" />}
        />
      )}
    </>
  );
}
