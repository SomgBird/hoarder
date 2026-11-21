import type { WizardStep } from "./wizardTypes";
import styles from "./WizardStepList.module.css";

export function WizardStepList({ steps, currentIndex }: { steps: WizardStep[]; currentIndex: number }) {
  return <ol aria-label="Steps" className={styles.steps}>
    {steps.map((step, index) => <li key={step.title} aria-current={index === currentIndex ? "step" : undefined}>
      <span aria-hidden="true">{index < currentIndex ? "✓" : ""}</span>{step.title}
    </li>)}
  </ol>;
}
