import type { MediaFileRead } from "../types/media.ts";
import { request } from "./client.ts";

export const mediaService = {
  list: (signal?: AbortSignal) => request<MediaFileRead[]>("/media/", { signal }),
};
