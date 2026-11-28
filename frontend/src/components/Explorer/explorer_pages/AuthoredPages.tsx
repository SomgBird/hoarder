import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { articleService, type ArticleSummary } from "@services/articleService";
import { franchisePageService, type FranchisePageSummary } from "@services/franchisePageService";
import { ExplorerLink } from "../ExplorerLink";
import { ErrorPage } from "./ErrorPage";
import styles from "./ExplorerMessage.module.css";

export function AuthoredPages() {
  const [pages, setPages] = useState<{ articles: ArticleSummary[]; franchises: FranchisePageSummary[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([articleService.list(controller.signal), franchisePageService.list(controller.signal)]).then(([articles, franchises]) => {
      if (!controller.signal.aborted) setPages({ articles, franchises });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Request failed.");
    });
    return () => controller.abort();
  }, []);

  if (error) return <ErrorPage heading="Could not load authored pages" message={error} hint="Choose Refresh to try again." />;
  return <section className={styles.article}>
    <h1>Authored pages</h1>
    {pages === null ? <p role="status">Loading authored pages…</p> : <>
      <h2>Articles</h2>
      {pages.articles.length === 0 ? <p>No articles yet.</p>
        : <ul>{pages.articles.map(({ id, title }) =>
          <li key={id}><ExplorerLink to={{ page: "article", id }}>{title}</ExplorerLink></li>)}</ul>}
      <h2>Franchise pages</h2>
      {pages.franchises.length === 0 ? <p>No franchise pages yet.</p>
        : <ul>{pages.franchises.map(({ id, title }) =>
          <li key={id}><ExplorerLink to={{ page: "franchise", id }}>{title}</ExplorerLink></li>)}</ul>}
    </>}
    <p><Link to="/page-editor?new=article">Create an article…</Link></p>
    <p><Link to="/page-editor?new=franchise">Write a franchise introduction…</Link></p>
  </section>;
}
