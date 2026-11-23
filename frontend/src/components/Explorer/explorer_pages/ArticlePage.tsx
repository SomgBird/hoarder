import { useEffect, useState } from "react";
import { articleService, type ArticleRead } from "@services/articleService";
import { ApiError } from "@services/client";
import { ErrorPage } from "./ErrorPage";
import { ExplorerLink } from "../ExplorerLink";
import styles from "./ExplorerMessage.module.css";

export function ArticlePage({ id }: { id: number }) {
  const [article, setArticle] = useState<ArticleRead | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    articleService.get(id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setArticle(result);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause : new Error("Request failed."));
    });
    return () => controller.abort();
  }, [id]);

  if (error instanceof ApiError && error.status === 404) {
    return <ErrorPage heading="Article not found" message={`There is no article with id ${id} in the collection.`}
      hint="Check the article number in the address." />;
  }
  if (error) return <ErrorPage heading="Could not load article" message={error.message} hint="Choose Refresh to try again." />;
  if (!article) return <p role="status">Loading article…</p>;
  return <article className={styles.article}>
    <h1>{article.title}</h1>
    {article.blocks.map((block) => {
      if (block.kind === "text") return <p key={block.id}>{block.text}</p>;
      if (block.item_title === null) return <p key={block.id}>Item #{block.item_id} is unavailable.</p>;
      return <p key={block.id}><ExplorerLink to={{ page: "item", id: block.item_id }}>
        {block.item_title}
      </ExplorerLink></p>;
    })}
  </article>;
}
