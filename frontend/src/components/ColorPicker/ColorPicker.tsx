import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Button, Frame, Input, TitleBar } from "@react95/core";
import { HelpButton } from "@components/HelpButton/HelpButton";
import { ColorSpectrum } from "./ColorSpectrum";
import { clamp, hexToHsl, hslToHex, isHexColor, type HslColor } from "./colorUtils";
import styles from "./ColorPicker.module.css";

const BASIC_COLORS = [
  "#ff8080", "#ffff80", "#80ff80", "#00ff80", "#80ffff", "#0080ff", "#ff80c0", "#ff80ff",
  "#ff0000", "#ffff00", "#80ff00", "#00ff40", "#00ffff", "#0080c0", "#8080c0", "#ff00ff",
  "#804040", "#ff8040", "#00ff00", "#008080", "#004080", "#8080ff", "#800040", "#ff0080",
  "#800000", "#ff8000", "#008000", "#008040", "#0000ff", "#0000a0", "#800080", "#8000ff",
  "#400000", "#804000", "#004000", "#004040", "#000080", "#000040", "#400040", "#400080",
  "#000000", "#808000", "#808040", "#808080", "#408080", "#c0c0c0", "#f0fbff", "#ffffff",
];
const CUSTOM_COLORS_KEY = "hoarder.customColors";

function readCustomColors(): string[] {
  let saved: unknown;
  try { saved = JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) ?? "null"); } catch { /* Use blank slots. */ }
  return Array.from({ length: 16 }, (_, index) => Array.isArray(saved) && isHexColor(saved[index])
    ? saved[index].toLowerCase() : "#ffffff");
}

interface ColorPickerProps {
  value: string;
  onSelect: (color: string) => void;
  onDismiss: () => void;
}

function paletteKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 }[event.key];
  if (offset === undefined) return;
  event.preventDefault();
  const buttons = [...event.currentTarget.querySelectorAll("button")];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  buttons[(index + offset + buttons.length) % buttons.length]?.focus();
}

export function ColorPicker({ value, onSelect, onDismiss }: ColorPickerProps) {
  const [hsl, setHsl] = useState(() => hexToHsl(value));
  const [hex, setHex] = useState(value.toUpperCase());
  const [customColors, setCustomColors] = useState(readCustomColors);
  const [customIndex, setCustomIndex] = useState(0);
  const [paletteFocus, setPaletteFocus] = useState(() => Math.max(0, BASIC_COLORS.indexOf(value.toLowerCase())));
  const [customFocus, setCustomFocus] = useState(0);
  const [selection, setSelection] = useState<{ group: "basic" | "custom"; index: number } | null>(
    () => ({ group: "basic", index: BASIC_COLORS.indexOf(value.toLowerCase()) }),
  );
  const dialog = useRef<HTMLDivElement>(null);
  const palette = useRef<HTMLDivElement>(null);
  const [previousFocus] = useState(() => document.activeElement as HTMLElement | null);
  const id = useId();
  const valid = isHexColor(hex);
  const color = hslToHex(hsl);
  const rgb = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16));
  const choose = (next: string) => {
    setHsl((current) => hexToHsl(next, current.hue));
    setHex(next.toUpperCase());
    setSelection(null);
  };
  const changeHsl = (next: HslColor) => {
    setHsl(next);
    setHex(hslToHex(next).toUpperCase());
    setSelection(null);
  };

  useEffect(() => {
    const selected = palette.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    (selected ?? palette.current?.querySelector("button"))?.focus();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [previousFocus]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
      }
      if (event.key === "Tab") {
        const controls = [...(dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled):not([tabindex="-1"]), [href], input:not(:disabled), [role="slider"][tabindex="0"]',
        ) ?? [])];
        const first = controls[0];
        const last = controls.at(-1);
        if (!dialog.current?.contains(document.activeElement)
          || (event.shiftKey && document.activeElement === first)
          || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return createPortal(
    <div className={styles.overlay}>
      <Frame ref={dialog} className={styles.window} bgColor="$material" boxShadow="$out"
        role="dialog" aria-modal="true" aria-label="Color">
        <TitleBar title="Color">
          <TitleBar.OptionsBox>
            <HelpButton topic="color-picker" label="Color picker help" />
            <TitleBar.Close type="button" aria-label="Close color picker" onClick={onDismiss} />
          </TitleBar.OptionsBox>
        </TitleBar>
        <form className={styles.body} onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSelect(hex.toLowerCase());
        }}>
          <div className={styles.palettes}>
            <p id={`${id}-basic`} className={styles.label}>Basic colors:</p>
            <div ref={palette} className={styles.palette} role="group" aria-labelledby={`${id}-basic`} onKeyDown={paletteKeyDown}>
              {BASIC_COLORS.map((swatch, index) => <Button key={swatch} type="button"
                className={styles.swatch} aria-label={swatch.toUpperCase()}
                aria-pressed={selection?.group === "basic" && selection.index === index}
                tabIndex={paletteFocus === index ? 0 : -1} onFocus={() => setPaletteFocus(index)}
                onClick={() => { choose(swatch); setSelection({ group: "basic", index }); }}>
                <span style={{ backgroundColor: swatch }} />
              </Button>)}
            </div>
            <p id={`${id}-custom`} className={styles.customLabel}>Custom colors:</p>
            <div className={styles.palette} role="group" aria-labelledby={`${id}-custom`} onKeyDown={paletteKeyDown}>
              {customColors.map((swatch, index) => <Button key={index} type="button"
                className={styles.swatch} aria-label={`Custom color ${index + 1}: ${swatch.toUpperCase()}`}
                aria-pressed={selection?.group === "custom" && selection.index === index}
                tabIndex={customFocus === index ? 0 : -1} onFocus={() => setCustomFocus(index)}
                onClick={() => { choose(swatch); setCustomIndex(index); setSelection({ group: "custom", index }); }}>
                <span style={{ backgroundColor: swatch }} />
              </Button>)}
            </div>
            <Button type="button" className={styles.define} disabled>Define Custom Colors »</Button>
            <div className={styles.actions}>
              <Button type="submit" disabled={!valid}>OK</Button>
              <Button type="button" onClick={onDismiss}>Cancel</Button>
            </div>
          </div>
          <div className={styles.editor}>
            <ColorSpectrum color={hsl} onChange={changeHsl} />
            <div className={styles.details}>
              <div className={styles.colorSample}>
                <Frame className={styles.sample} boxShadow="$in" style={{ backgroundColor: color }} aria-label="Selected color" />
                <span>Color | Solid</span>
                <Input aria-label="Hex color" className={styles.hex} value={hex} maxLength={7} spellCheck={false}
                  aria-invalid={!valid} aria-describedby={!valid ? `${id}-error` : undefined}
                  onChange={(event) => {
                    const next = event.target.value;
                    setHex(next);
                    if (isHexColor(next)) {
                      setHsl((current) => hexToHsl(next, current.hue));
                      setSelection(null);
                    }
                  }} />
              </div>
              <div className={styles.channels}>
                {(["hue", "saturation", "luminance"] as const).map((channel, index) => (
                  <label key={channel} className={styles.channel}>{["Hue", "Sat", "Lum"][index]}:
                    <Input aria-label={channel[0].toUpperCase() + channel.slice(1)} type="number" min={0}
                      max={channel === "hue" ? 239 : 240} step={1} value={clamp(Math.round(hsl[channel]), channel === "hue" ? 239 : 240)}
                      onChange={(event) => {
                        const number = Number(event.target.value);
                        if (Number.isInteger(number) && number >= 0 && number <= (channel === "hue" ? 239 : 240)) {
                          changeHsl({ ...hsl, [channel]: number });
                        }
                      }} />
                  </label>
                ))}
                {["Red", "Green", "Blue"].map((label, channel) => <label key={label} className={styles.channel}>{label}:
                  <Input aria-label={label} type="number" min={0} max={255} step={1} value={rgb[channel]}
                    onChange={(event) => {
                      const number = Number(event.target.value);
                      if (!Number.isInteger(number) || number < 0 || number > 255) return;
                      const start = 1 + channel * 2;
                      choose(color.slice(0, start) + number.toString(16).padStart(2, "0") + color.slice(start + 2));
                    }} />
                </label>)}
              </div>
            </div>
            <Button type="button" className={styles.add} disabled={!valid} onClick={() => {
              const next = customColors.map((swatch, index) => index === customIndex ? color : swatch);
              setCustomColors(next);
              setSelection({ group: "custom", index: customIndex });
              setCustomFocus(customIndex);
              setCustomIndex((customIndex + 1) % next.length);
              try { localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(next)); } catch { /* Keep colors for this dialog. */ }
            }}>Add to Custom Colors</Button>
          </div>
          {!valid && <p id={`${id}-error`} className={styles.hint} role="alert">Enter a color like #008080.</p>}
        </form>
      </Frame>
    </div>,
    document.body,
  );
}
