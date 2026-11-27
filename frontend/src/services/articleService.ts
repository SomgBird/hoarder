import type { components } from "../types/api.generated";
import { request } from "./client";

export type ArticleRead = components["schemas"]["ArticleRead"];
export type ArticleSummary = components["schemas"]["ArticleSummary"];
export type ArticleCreate = components["schemas"]["ArticleCreate"];
export type ArticleUpdate = components["schemas"]["ArticleUpdate"];
export type GalleryEntry = components["schemas"]["GalleryEntryRead"];

export const articleService = {
  list: (signal?: AbortSignal) => request<ArticleSummary[]>("/articles/", { signal }),
  create: (article: ArticleCreate) =>
    request<ArticleRead>("/articles/", { method: "POST", body: JSON.stringify(article) }),
  get: (id: number, signal?: AbortSignal) => request<ArticleRead>(`/articles/${id}`, { signal }),
  update: (id: number, changes: ArticleUpdate) =>
    request<ArticleRead>(`/articles/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
};
