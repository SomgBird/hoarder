import { Frame } from "@react95/core";

import styles from "./WizardBanner.module.css";

interface WizardBannerProps {
  bannerImage?: string;
}

export function WizardBanner({ bannerImage }: WizardBannerProps) {
  return (
    <Frame bgColor="canvas" boxShadow="in" className={styles.banner_frame}>
      {bannerImage ? (
        <img src={bannerImage} alt="" className={styles.banner_image} />
      ) : (
        <div className={styles.banner_image_placeholder}>Image</div>
      )}
    </Frame>
  );
}
