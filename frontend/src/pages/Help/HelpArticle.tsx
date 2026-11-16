import { useEffect, useRef } from "react";
import { Frame } from "@react95/core";
import { HELP_TOPICS, type HelpPage } from "@config/help";
import { helpArticles } from "./helpArticles";
import { HelpFolder } from "./HelpFolder";
import { HelpLink } from "./HelpLink";
import styles from "./Help.module.css";

interface Props {
  page: HelpPage;
  standalone: boolean;
  onNavigate: (page: HelpPage) => void;
}

export function HelpArticle({ page, standalone, onNavigate }: Props) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [page.kind, page.id]);

  const article = page.kind === "topic" ? helpArticles[page.id] : null;
  return (
    <Frame as="article" className={styles.article} bgColor="$inputBackground" boxShadow="$in" aria-labelledby="help-topic-title">
      <div ref={body} className={styles.articleBody} role="region" aria-labelledby="help-topic-title" tabIndex={0}>
        {page.kind === "topic" && article ? <div className={styles.topicText}>
          <h1 id="help-topic-title" aria-live="polite">{HELP_TOPICS[page.id]}</h1>
          <p className={styles.introduction}>{article.introduction}</p>
          {article.content}
          <footer className={styles.related}>
            <h2>See also</h2>
            {article.related.map((id) => <HelpLink key={id} page={{ kind: "topic", id }} standalone={standalone} onNavigate={onNavigate}>
              {HELP_TOPICS[id]}
            </HelpLink>)}
          </footer>
        </div> : page.kind === "folder" && <HelpFolder folder={page.id} standalone={standalone} onNavigate={onNavigate} />}
      </div>
    </Frame>
  );
}
