import type { AuthorRead, CompanyRead } from "@types";
import { request } from "./client.ts";

export const referenceService = {
  authors: (query: string, signal?: AbortSignal) =>
    request<AuthorRead[]>(`/reference/authors?q=${encodeURIComponent(query)}&limit=20`, { signal }),
  companies: (query: string, signal?: AbortSignal) =>
    request<CompanyRead[]>(`/reference/companies?q=${encodeURIComponent(query)}&limit=20`, { signal }),
};
