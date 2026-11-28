import type { components } from "../types/api.generated";
import { request } from "./client";

export type FranchisePageRead = components["schemas"]["FranchisePageRead"];
export type FranchisePageSummary = components["schemas"]["FranchisePageSummary"];

export const franchisePageService = {
  list: (signal?: AbortSignal) => request<FranchisePageSummary[]>("/franchise-pages/", { signal }),
  get: (id: number, signal?: AbortSignal) => request<FranchisePageRead>(`/franchise-pages/${id}`, { signal }),
  save: (id: number, introduction: string) => request<FranchisePageRead>(`/franchise-pages/${id}`, {
    method: "PUT", body: JSON.stringify({ introduction }),
  }),
};
