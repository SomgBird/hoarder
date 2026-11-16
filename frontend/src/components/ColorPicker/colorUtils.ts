export interface HslColor {
  hue: number;
  saturation: number;
  luminance: number;
}

export const isHexColor = (value: unknown): value is string => typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
export const clamp = (value: number, maximum: number) => Math.min(maximum, Math.max(0, value));

// The classic Windows dialog uses 0–239 for hue and 0–240 for saturation/luminance.
export function hexToHsl(hex: string, fallbackHue = 0): HslColor {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  if (difference === 0) return { hue: fallbackHue, saturation: 0, luminance: lightness * 240 };
  const sector = maximum === red ? (green - blue) / difference + (green < blue ? 6 : 0)
    : maximum === green ? (blue - red) / difference + 2 : (red - green) / difference + 4;
  return {
    hue: sector * 40,
    saturation: difference / (1 - Math.abs(2 * lightness - 1)) * 240,
    luminance: lightness * 240,
  };
}

export function hslToHex({ hue, saturation, luminance }: HslColor): string {
  const lightness = luminance / 240;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation / 240;
  const sector = hue / 40;
  const secondary = chroma * (1 - Math.abs(sector % 2 - 1));
  const components = sector < 1 ? [chroma, secondary, 0] : sector < 2 ? [secondary, chroma, 0]
    : sector < 3 ? [0, chroma, secondary] : sector < 4 ? [0, secondary, chroma]
      : sector < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
  const offset = lightness - chroma / 2;
  return "#" + components.map((component) => Math.round((component + offset) * 255).toString(16).padStart(2, "0")).join("");
}
