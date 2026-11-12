export const API_BASE = (import.meta.env?.VITE_API_BASE ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

export interface ValidationIssue {
  loc: (string | number)[];
  msg: string;
  type?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail: string;
  readonly errors: ValidationIssue[];

  constructor(status: number, statusText: string, body: unknown) {
    const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const detail = typeof data.detail === "string" ? data.detail : `Request failed: ${status} ${statusText}`;
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.code = typeof data.code === "string" ? data.code : undefined;
    this.detail = detail;
    const issues = Array.isArray(data.errors) ? data.errors : Array.isArray(data.detail) ? data.detail : [];
    this.errors = issues.filter((issue): issue is ValidationIssue =>
      issue && typeof issue === "object" && Array.isArray(issue.loc) &&
      issue.loc.every((part: unknown) => typeof part === "string" || typeof part === "number") &&
      typeof issue.msg === "string",
    );
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (typeof options?.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, body);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}
