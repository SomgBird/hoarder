import Separator from "@components/Separator";
import { Button, Frame, TitleBar } from "@react95/core";
import styles from "./Wizard.module.css";
import type { WizardProps } from "./types";


export function Wizard<T extends object>({title, icon}: WizardProps<T>) {
  return (
    <div>
      <Frame bgColor="$material" boxShadow="$out" padding="$2">
        <TitleBar icon={icon} title={title}></TitleBar>
        <div className={styles.wizard_content_wrapper}>
          <p>This is {title}.</p>
          <Separator />
          <div className={styles.buttons_section}>
            <Button>&lt; Back</Button>
            <Button>Next &gt;</Button>
            <Button className={styles.cancel_button}>Cancel</Button>
          </div>
        </div>
      </Frame>
    </div>
  );
}
