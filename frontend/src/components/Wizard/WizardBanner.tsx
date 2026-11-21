import type { ReactNode } from "react";
import styles from "./WizardBanner.module.css";

export function WizardBanner({ bannerImage, children }: { bannerImage?: string; children: ReactNode }) {
  return <div className={styles.banner}>
    {bannerImage && <img src={bannerImage} alt="" />}
    {children}
  </div>;
}
