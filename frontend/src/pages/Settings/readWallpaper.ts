import { MAX_WALLPAPER_BYTES, WALLPAPER_TYPES, type Wallpaper } from "@config/wallpaper";

export function readWallpaper(file: File, signal: AbortSignal): Promise<Wallpaper> {
  if (!WALLPAPER_TYPES.includes(file.type)) return Promise.reject(new Error("Choose a PNG, JPEG, WebP, GIF, BMP, or AVIF image."));
  if (file.size === 0 || file.size > MAX_WALLPAPER_BYTES) return Promise.reject(new Error("Choose an image up to 2 MB."));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const image = new window.Image();
    const cleanup = () => {
      signal.removeEventListener("abort", abort);
      reader.onload = reader.onerror = reader.onabort = null;
      image.onload = image.onerror = null;
    };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const abort = () => {
      cleanup();
      reader.abort();
      image.src = "";
      reject(new DOMException("Wallpaper loading cancelled", "AbortError"));
    };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    reader.onerror = () => fail(new Error("This file could not be read. Choose it again."));
    reader.onload = () => {
      if (typeof reader.result !== "string") { fail(new Error("This file could not be read.")); return; }
      const dataUrl = reader.result;
      image.onerror = () => fail(new Error("This image could not be opened. Choose another file."));
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) { fail(new Error("This image has no usable dimensions.")); return; }
        cleanup();
        resolve({ name: file.name, dataUrl, width: image.naturalWidth, height: image.naturalHeight });
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
