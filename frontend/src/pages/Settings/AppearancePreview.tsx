import { Button, Frame, TitleBar } from "@react95/core";
import { appearanceStyle, type AppearanceSettings } from "@config/appearance";
import styles from "./AppearancePreview.module.css";

export function AppearancePreview({ settings }: { settings: AppearanceSettings }) {
  return (
    <figure className={styles.preview} aria-label="Appearance preview" style={appearanceStyle(settings)}>
      <div className={styles.monitor} aria-hidden="true" inert>
        <div className={styles.screen}>
          <Frame className={styles.inactiveWindow} bgColor="$material" boxShadow="$out" padding="$2">
            <TitleBar title="Inactive window" active={false} />
          </Frame>
          <Frame className={styles.activeWindow} bgColor="$material" boxShadow="$out" padding="$2">
            <TitleBar title="Hoarder" />
            <Frame className={styles.windowContent} bgColor="$inputBackground" boxShadow="$in">
              Window text
            </Frame>
            <div className={styles.previewActions}><Button tabIndex={-1}>OK</Button></div>
          </Frame>
          <div className={styles.taskbar}><span>Start</span><span>12:00</span></div>
        </div>
        <div className={styles.monitorBottom}><span /></div>
      </div>
      <div className={styles.stand} aria-hidden="true" />
      <figcaption>Preview</figcaption>
    </figure>
  );
}
