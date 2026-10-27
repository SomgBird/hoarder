import type { WizardStep } from "./wizardTypes";
import styles from "./WizardStepList.module.css";

interface WizardStepListProps {
  steps: WizardStep[];
  currentIndex: number;
}

export function WizardStepList({ steps, currentIndex }: WizardStepListProps) {
  return (
    <div aria-label="Steps" className={styles.list_wrapper}>
      {steps.map((s, i) => (
        <div
          key={i}
          aria-current={i === currentIndex ? "step" : undefined}
          className={styles.step_list}
          style={{ fontWeight: i === currentIndex ? "bold" : "normal" }}
        >
          <span className={styles.list_element_marker}>
            {i < currentIndex ? "✓" : i === currentIndex ? ">" : ""}
          </span>
          <span>{s.title}</span>
        </div>
      ))}
    </div>
  );
}
