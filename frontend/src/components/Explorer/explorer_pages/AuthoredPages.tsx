import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { articleService, type ArticleSummary } from "@services/articleService";
import { ExplorerLink } from "../ExplorerLink";
import { ErrorPage } from "./ErrorPage";
import styles from "./ExplorerMessage.module.css";

export function AuthoredPages() {
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    articleService.list(controller.signal).then((list) => {
      if (!controller.signal.aborted) setArticles(list);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Request failed.");
    });
    return () => controller.abort();
  }, []);

  if (error) return <ErrorPage heading="Could not load authored pages" message={error} hint="Choose Refresh to try again." />;
  return <section className={styles.article}>
    <h1>Authored pages</h1>
    {articles === null ? <p role="status">Loading articles…</p>
      : articles.length === 0 ? <p>No articles yet.</p>
      : <ul>{articles.map(({ id, title }) =>
        <li key={id}><ExplorerLink to={{ page: "article", id }}>{title}</ExplorerLink></li>)}</ul>}
    <p><Link to="/page-editor?new=article">Create an article…</Link></p>
  </section>;
}
