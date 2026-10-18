import Separator from "@components/Separator";
import { Button, Frame, TitleBar } from "@react95/core";
import type { ReactElement } from "react";
import styles from "./Wizard.module.css";

interface WizardProps {
  title: string;
  icon: ReactElement;
  text?: string;
}

export function Wizard({ title, icon, text }: WizardProps) {
  return (
    <div>
      <Frame bgColor="$material" boxShadow="$out" padding="$2">
        <TitleBar icon={icon} title={title}></TitleBar>
        <div className={styles.wizard_content_wrapper}>
          <p>This is {title}.</p>
          <p>{text}</p>
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
