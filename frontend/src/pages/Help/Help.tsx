import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Frame, Tab, Tabs, TitleBar } from "@react95/core";
import {
  HelpBook, Printer, Progman44, Progman45,
} from "@react95/icons";
import { Toolbar } from "@components/Toolbar";
import { HELP_TOPICS, isHelpTopic, type HelpTopicId } from "@config/help";
import { helpArticles } from "./helpArticles";
import { HelpContents } from "./HelpContents";
import styles from "./Help.module.css";

interface HelpHistory {
  topics: HelpTopicId[];
  index: number;
}

export default function Help() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("topic");
  const topic = isHelpTopic(requested) ? requested : "welcome";
  const location = useLocation();
  const savedHistory = location.state?.helpHistory as HelpHistory | undefined;
  const history: HelpHistory = savedHistory?.topics?.[savedHistory.index] === topic
    ? savedHistory : { topics: [topic], index: 0 };
  const [contentsVisible, setContentsVisible] = useState(true);
  const article = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const current = helpArticles[topic];

  useEffect(() => { if (article.current) article.current.scrollTop = 0; }, [topic]);

  const showTopic = (next: HelpTopicId) => {
    if (next === topic) return;
    const helpHistory = { topics: [...history.topics.slice(0, history.index + 1), next], index: history.index + 1 };
    setParams((previous) => { previous.set("topic", next); return previous; }, { replace: true, state: { helpHistory } });
  };
  const go = (offset: number) => {
    const index = history.index + offset;
    if (index < 0 || index >= history.topics.length) return;
    setParams((previous) => { previous.set("topic", history.topics[index]); return previous; },
      { replace: true, state: { helpHistory: { ...history, index } } });
  };
  const close = () => {
    if (params.get("window") === "1" && window.opener) window.close();
    else navigate("/");
  };
  return (
    <Frame data-help-window className={styles.window} bgColor="$material" boxShadow="$out" padding="$3">
      <TitleBar title="Hoarder Help" icon={<HelpBook variant="16x16_4" />}>
        <TitleBar.OptionsBox><TitleBar.Close type="button" aria-label="Close Help" onClick={close} /></TitleBar.OptionsBox>
      </TitleBar>
      <Toolbar className={styles.toolbar}>
        <Toolbar.Button icon={<HelpBook variant="32x32_4" />} label={contentsVisible ? "Hide" : "Contents"}
          aria-label={contentsVisible ? "Hide contents" : "Show contents"} aria-expanded={contentsVisible}
          aria-controls="help-contents" onClick={() => setContentsVisible((visible) => !visible)} />
        <Toolbar.Separator />
        <Toolbar.Button icon={<Progman44 variant="32x32_4" />} label="Back" disabled={history.index === 0} onClick={() => go(-1)} />
        <Toolbar.Button icon={<Progman45 variant="32x32_4" />} label="Forward" disabled={history.index === history.topics.length - 1} onClick={() => go(1)} />
        <Toolbar.Separator />
        <Toolbar.Button icon={<Printer variant="32x32_4" />} label="Print" onClick={() => window.print()} />
      </Toolbar>
      <div className={styles.panes} data-contents-visible={contentsVisible}>
        {contentsVisible && <aside id="help-contents" className={styles.contents} aria-label="Help contents">
          <Tabs><Tab title="Contents">
            <Frame className={styles.treePanel} bgColor="$inputBackground" boxShadow="$in">
              <HelpContents topic={topic} onSelect={showTopic} />
            </Frame>
          </Tab></Tabs>
        </aside>}
        <Frame as="article" ref={article} className={styles.article} bgColor="$inputBackground" boxShadow="$in"
          aria-labelledby="help-topic-title" tabIndex={0}>
          <header className={styles.articleHeader}>
            <span>Hoarder Help</span>
            <h1 id="help-topic-title" aria-live="polite">{HELP_TOPICS[topic]}</h1>
          </header>
          <div className={styles.articleBody}>
            <p className={styles.introduction}>{current.introduction}</p>
            {current.content}
            <footer className={styles.related}>
              <h2>See also</h2>
              {current.related.map((key) => <button key={key} type="button" onClick={() => showTopic(key)}>{HELP_TOPICS[key]}</button>)}
            </footer>
          </div>
        </Frame>
      </div>
      <Frame className={styles.status} boxShadow="$in" role="status">{HELP_TOPICS[topic]}</Frame>
    </Frame>
  );
}
