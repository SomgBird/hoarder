import { API_BASE } from './client.ts'

export function coverUrl(path: string | null): string | null {
  if (!path) return null;
  return `${API_BASE}${path}`;   // "/media/covers/x.jpg" → full URL
}