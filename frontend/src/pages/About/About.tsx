import { Frame, TitleBar } from "@react95/core";
import styles from "./About.module.css";
import { Winhlp324000 } from "@react95/icons";

interface AppInfo {
  name: string;
  version: string;
  author: string;
  year: number;
  description: string;
  repo: string;
}

const APP: AppInfo = {
  name: "Hoarder",
  version: "pre-alpha",
  author: "SomgBird",
  year: 2026,
  description:
    "A personal catalog and tracker for your games, books, journals, merch, and everything. Manage your collection and track wanted items in a single app.",
  repo: "https://github.com/SomgBird/hoarder",
};

export default function About() {
  return (
    <div className={styles.root}>
      <Frame bgColor="$material" boxShadow="$out" padding="$4">
        <TitleBar icon={<Winhlp324000 variant="16x16_4" />} title="About">
          <TitleBar.OptionsBox>
            <TitleBar.Close />
          </TitleBar.OptionsBox>
        </TitleBar>
        <Frame h="100%" bgColor="white" boxShadow="$in">
          <div className={styles.content}>
            <h3 className={styles.title}>{APP.name}</h3>
            <p className={styles.version}>Version {APP.version}</p>

            <p className={styles.paragraph}>{APP.description}</p>

            <p className={styles.paragraph}>
              © {APP.year} {APP.author}
            </p>

            <p className={styles.paragraphLast}>
              Built with{" "}
              <a href="https://github.com/react95/react95">react95</a>, FastAPI
              and SQLModel.
              <br />
              <a href={APP.repo}>Source code (GitHub)</a>
            </p>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
