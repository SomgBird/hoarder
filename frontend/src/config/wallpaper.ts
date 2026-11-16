export const WALLPAPER_MODES = {
  center: "Center", tile: "Tile", stretch: "Stretch", fitWidth: "Fit horizontally",
} as const;
export type WallpaperMode = keyof typeof WALLPAPER_MODES;

export interface Wallpaper {
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const WALLPAPER_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp", "image/avif"];
export const MAX_WALLPAPER_BYTES = 2 * 1024 * 1024;

export function isWallpaperMode(value: unknown): value is WallpaperMode {
  return typeof value === "string" && Object.hasOwn(WALLPAPER_MODES, value);
}

export function isWallpaper(value: unknown): value is Wallpaper {
  if (!value || typeof value !== "object") return false;
  const image = value as Partial<Wallpaper>;
  return typeof image.name === "string" && image.name.length > 0 && image.name.length <= 255
    && typeof image.dataUrl === "string" && image.dataUrl.length <= Math.ceil(MAX_WALLPAPER_BYTES / 3) * 4 + 64
    && /^data:image\/(png|jpeg|webp|gif|bmp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.dataUrl)
    && typeof image.width === "number" && Number.isSafeInteger(image.width) && image.width > 0
    && typeof image.height === "number" && Number.isSafeInteger(image.height) && image.height > 0;
}
