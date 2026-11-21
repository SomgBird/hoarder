import { API_BASE } from './client.ts'

export function coverUrl(path: string | null): string | null {
  if (!path) return null;
  return `${API_BASE}/${path.replace(/^\/+/, "")}`;
}

export function copyPhotoUrl(path: string): string {
  // Older copy records store paths relative to the media folder.
  if (path.startsWith("/media/")) return `${API_BASE}${path}`;
  const relative = path.split("/").map(encodeURIComponent).join("/");
  return `${API_BASE}/media/${relative}`;
}
