import type { PointerEvent } from "react";
import { Input } from "@react95/core";
import { clamp, hslToHex, type HslColor } from "./colorUtils";
import styles from "./ColorPicker.module.css";

interface Props {
  color: HslColor;
  onChange: (color: HslColor) => void;
}

export function ColorSpectrum({ color, onChange }: Props) {
  const position = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    onChange({
      ...color,
      hue: clamp((event.clientX - bounds.left) / bounds.width * 239, 239),
      saturation: clamp((1 - (event.clientY - bounds.top) / bounds.height) * 240, 240),
    });
  };

  return (
    <div className={styles.spectrumRow}>
      <div className={styles.spectrum} role="slider" tabIndex={0} aria-label="Hue and saturation"
        aria-valuemin={0} aria-valuemax={239} aria-valuenow={clamp(Math.round(color.hue), 239)}
        aria-valuetext={`Hue ${clamp(Math.round(color.hue), 239)}, saturation ${Math.round(color.saturation)}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          position(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) position(event);
        }}
        onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 1;
          const changes = event.key === "ArrowLeft" ? { hue: clamp(color.hue - step, 239) }
            : event.key === "ArrowRight" ? { hue: clamp(color.hue + step, 239) }
              : event.key === "ArrowUp" ? { saturation: clamp(color.saturation + step, 240) }
                : event.key === "ArrowDown" ? { saturation: clamp(color.saturation - step, 240) }
                  : event.key === "Home" ? { hue: 0 } : event.key === "End" ? { hue: 239 } : null;
          if (!changes) return;
          event.preventDefault();
          onChange({ ...color, ...changes });
        }}>
        <span className={styles.crosshair} aria-hidden="true"
          style={{ left: `${clamp(color.hue / 239 * 100, 100)}%`, top: `${(1 - color.saturation / 240) * 100}%` }} />
      </div>
      <div className={styles.luminance}>
        <div className={styles.luminanceTrack} aria-hidden="true"
          style={{ background: `linear-gradient(to bottom, #fff, ${hslToHex({ ...color, luminance: 120 })}, #000)` }} />
        <span className={styles.luminanceMarker} aria-hidden="true" style={{ top: `${(1 - color.luminance / 240) * 100}%` }} />
        <Input type="range" className={styles.luminanceRange} aria-label="Luminance" min={0} max={240} step={1}
          value={Math.round(color.luminance)} onChange={(event) => onChange({ ...color, luminance: Number(event.target.value) })} />
      </div>
    </div>
  );
}
