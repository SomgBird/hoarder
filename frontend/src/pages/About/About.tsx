import { Frame, Button, TitleBar } from "@react95/core";
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
  name: "Collection Manager",
  version: "pre-alpha",
  author: "SongBird",
  year: 2026,
  description: "A personal catalog for games, books, journals and merch.",
  repo: "https://github.com/SomgBird/hoarder",
};

export default function About() {
  return (
    <div className={styles.root}>
      <Frame w="320px" bgColor="$material" boxShadow="$out" padding="$4">
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
              Built with react95, FastAPI and SQLModel.
              <br />
              <a href={APP.repo} target="_blank" rel="noreferrer">
                Source code
              </a>
            </p>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
