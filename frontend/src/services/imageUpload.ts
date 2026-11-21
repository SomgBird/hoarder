export const imageTypes = ["image/jpeg", "image/png", "image/webp"];
export const imageRequirements = "JPEG, PNG or WebP, up to 5 MB.";

export function isValidImageFile(file: File) {
  return imageTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
}
