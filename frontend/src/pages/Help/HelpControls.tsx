import { Frame } from "@react95/core";
import { HelpBook, Printer, Progman44, Progman45 } from "@react95/icons";
import EtchedBox from "@components/EtchedBox/EtchedBox";
import Separator from "@components/Separator";
import { Toolbar } from "@components/Toolbar";
import { HelpLink } from "./HelpLink";
import type { useHelpNavigation } from "./useHelpNavigation";
import styles from "./Help.module.css";

interface Props {
  navigation: ReturnType<typeof useHelpNavigation>;
  contentsVisible: boolean;
  onToggleContents: () => void;
}

export function HelpControls({ navigation, contentsVisible, onToggleContents }: Props) {
  const { path, parent, standalone, showPage, go, canGoBack, canGoForward } = navigation;
  return (
    <EtchedBox className={styles.controls}>
      <Toolbar className={styles.toolbar} labelPosition="bottom">
        <Toolbar.Button icon={<Progman44 variant="32x32_4" />} label="Back" disabled={!canGoBack} onClick={() => go(-1)} />
        <Toolbar.Button icon={<Progman45 variant="32x32_4" />} label="Forward" disabled={!canGoForward} onClick={() => go(1)} />
        <Toolbar.Button icon={<Progman44 className={styles.upIcon} variant="32x32_4" />} label="Up" disabled={!parent}
          onClick={() => { if (parent) showPage(parent); }} />
        <Toolbar.Separator />
        <Toolbar.Button icon={<HelpBook variant="32x32_4" />} label="Contents"
          aria-label={contentsVisible ? "Hide contents" : "Show contents"} aria-expanded={contentsVisible} aria-pressed={contentsVisible}
          aria-controls="help-contents" onClick={onToggleContents} />
        <Toolbar.Separator />
        <Toolbar.Button icon={<Printer variant="32x32_4" />} label="Print" onClick={() => window.print()} />
      </Toolbar>
      <Separator className={styles.controlSeparator} />
      <div className={styles.addressBar}>
        <span>Address</span>
        <Frame className={styles.addressField} bgColor="$inputBackground" boxShadow="$in">
          <HelpBook variant="16x16_4" aria-hidden="true" />
          <nav className={styles.topicPath} aria-label="Help topic path">
            {path.map((entry, index) => <span key={`${entry.page.kind}-${entry.page.id}`}>
              {index > 0 && <span aria-hidden="true"> › </span>}
              {index === path.length - 1 ? <span aria-current="page">{entry.label}</span>
                : <HelpLink page={entry.page} standalone={standalone} onNavigate={showPage}>{entry.label}</HelpLink>}
            </span>)}
          </nav>
        </Frame>
      </div>
    </EtchedBox>
  );
}
