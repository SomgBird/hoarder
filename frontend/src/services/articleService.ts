import type { components } from "../types/api.generated";
import { request } from "./client";

export type ArticleRead = components["schemas"]["ArticleRead"];
type ArticleCreate = components["schemas"]["ArticleCreate"];

export const articleService = {
  create: (article: ArticleCreate) =>
    request<ArticleRead>("/articles/", { method: "POST", body: JSON.stringify(article) }),
  get: (id: number, signal?: AbortSignal) => request<ArticleRead>(`/articles/${id}`, { signal }),
};
