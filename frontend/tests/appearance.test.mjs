import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h, StrictMode } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "HTMLElement", "Event", "MouseEvent", "KeyboardEvent", "localStorage", "FileReader", "File"]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.__APP_VERSION__ = "test";
const { tokens } = await import("@react95/core");
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../src/App.tsx");
const { APPEARANCE_STORAGE_KEY, themeOptions } = await import("../src/config/appearance.ts");
const { MAX_WALLPAPER_BYTES } = await import("../src/config/wallpaper.ts");
const { readWallpaper } = await import("../src/pages/Settings/readWallpaper.ts");

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCqkAAAAASUVORK5CYII=";
const originalImage = window.Image;

let root, container;
beforeEach(() => {
  window.Image = class {
    naturalWidth = 1;
    naturalHeight = 1;
    set src(value) {
      if (!value) return;
      queueMicrotask(() => value === `data:image/png;base64,${PNG}` ? this.onload?.() : this.onerror?.());
    }
  };
  localStorage.clear();
  document.documentElement.removeAttribute("style");
  document.body.style.removeProperty("background-image");
  window.history.replaceState({}, "", "/settings");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  window.Image = originalImage;
});

const render = () => act(async () => { root.render(h(StrictMode, null, h(App))); });
const settingsWindow = () => container.querySelector('[aria-label="Display Properties"]');
const theme = () => container.querySelector("#react95-theme");
const background = () => container.querySelector("#system-background");
const dialog = () => document.querySelector('[role="dialog"][aria-label="Color"]');
const preview = () => container.querySelector('[aria-label="Appearance preview"]');
const previewImage = () => preview().querySelector('[class*="screen"]').style.backgroundImage;
const desktopImage = () => document.body.style.backgroundImage;
const button = (text, scope = settingsWindow()) => [...scope.querySelectorAll("button")]
  .find((node) => node.textContent.trim() === text && !node.closest('[aria-hidden="true"]'));
const tab = (title) => container.querySelector(`[role="tab"][title="${title}"]`)
  ?? [...container.querySelectorAll('[role="tab"]')].find((node) => node.textContent === title);
const css = (property) => document.documentElement.style.getPropertyValue(property);
const saved = () => JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY));
const wallpaperFile = () => new File([Buffer.from(PNG, "base64")], "Wallpaper.png", { type: "image/png" });
const fileInput = () => container.querySelector('input[type="file"][aria-label="Browse wallpaper"]');
const select = (node, value) => act(async () => {
  node.value = value;
  node.dispatchEvent(new Event("change", { bubbles: true }));
});
const uploadWallpaper = (file) => act(async () => {
  Object.defineProperty(fileInput(), "files", { configurable: true, value: [file] });
  fileInput().dispatchEvent(new Event("change", { bubbles: true }));
  for (let attempt = 0; attempt < 50; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2));
    if (!settingsWindow().textContent.includes("Opening image…")) break;
  }
});
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const key = (node, value, options = {}) => act(async () => {
  node.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options }));
});
const input = (node, value) => act(async () => {
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(node, value);
  node.dispatchEvent(new Event("input", { bubbles: true }));
});
const changeTheme = async (name) => {
  await click(tab("Appearance"));
  await act(async () => {
    theme().value = themeOptions.find((option) => option.name === name).label;
    theme().dispatchEvent(new Event("change", { bubbles: true }));
  });
};
const changeBackground = async (value) => {
  await click(tab("Background"));
  await click(background());
  await input(dialog().querySelector('[aria-label="Hex color"]'), value);
  await click(button("OK", dialog()));
};
const remount = async () => {
  await act(() => root.unmount());
  root = createRoot(container);
  await render();
};

test("Settings opens as a tabbed properties window with every built-in theme and the existing defaults", async () => {
  window.history.replaceState({}, "", "/");
  await render();
  await click([...container.querySelectorAll("nav li")].find((node) => node.textContent === "Settings"));
  assert.equal(window.location.pathname, "/settings");
  assert.equal(container.querySelector('nav [aria-current="page"]').textContent, "Settings");
  assert.match(background().textContent, /#008080/);
  assert.equal(container.querySelector('input[type="color"]'), null);
  assert.equal(button("Apply").disabled, true);
  await click(tab("Appearance"));
  assert.equal(theme().options.length, Object.keys(tokens).length);
  assert.equal(theme().value, "Brick");
  assert.ok([...theme().options].some((option) => option.value === "Windows 95"));
  assert.equal(css("--r95-color-headerBackground"), tokens.brick.colors.headerBackground);
  assert.equal(css("--hoarder-background"), "#008080");
});

test("each theme previews locally and Apply saves its colors and shadows while retaining the chosen background", async () => {
  await render();
  await changeBackground("#123456");
  assert.equal(css("--hoarder-background"), "#008080");
  assert.equal(preview().style.getPropertyValue("--hoarder-background"), "#123456");
  assert.equal(saved(), null);
  for (const [name, token] of Object.entries(tokens)) {
    await changeTheme(name);
    assert.equal(preview().style.getPropertyValue("--r95-color-material"), token.colors.material, name);
    await click(button("Apply"));
    assert.equal(css("--r95-color-material"), token.colors.material, name);
    assert.equal(css("--r95-color-headerBackground"), token.colors.headerBackground, name);
    assert.equal(css("--r95-shadow-out"), token.shadows.out, name);
    assert.equal(css("--hoarder-background"), "#123456", name);
    assert.deepEqual(saved(), { theme: name, backgroundColor: "#123456", wallpaper: null, wallpaperMode: "center" });
    assert.equal(button("Apply").disabled, true);
  }
  await remount();
  assert.match(background().textContent, /#123456/);
  await click(tab("Appearance"));
  assert.equal(theme().value, "Windows 95");
});

test("saved choices load at startup and Reset restores the project defaults when applied", async () => {
  localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: "modernDark", backgroundColor: "#123456" }));
  await render();
  assert.match(background().textContent, /#123456/);
  assert.equal(css("--r95-color-material"), tokens.modernDark.colors.material);
  await click(button("Reset to default"));
  assert.match(background().textContent, /#008080/);
  assert.equal(css("--hoarder-background"), "#123456");
  await click(button("Apply"));
  assert.equal(css("--r95-color-material"), tokens.brick.colors.material);
  assert.equal(css("--hoarder-background"), "#008080");
  assert.equal(localStorage.getItem(APPEARANCE_STORAGE_KEY), null);
  await remount();
  assert.match(background().textContent, /#008080/);
  await click(tab("Appearance"));
  assert.equal(theme().value, "Brick");
});

test("Cancel and the titlebar close discard drafts; OK saves and closes", async () => {
  for (const action of ["Cancel", "close", "OK"]) {
    window.history.replaceState({}, "", "/settings");
    await remount();
    await changeTheme("matrix");
    assert.equal(css("--r95-color-material"), tokens.brick.colors.material);
    await click(action === "close" ? container.querySelector('[aria-label="Close settings"]') : button(action));
    assert.equal(window.location.pathname, "/");
    assert.equal(css("--r95-color-material"), action === "OK" ? tokens.matrix.colors.material : tokens.brick.colors.material);
    assert.equal(saved()?.theme ?? null, action === "OK" ? "matrix" : null);
  }
});

test("color palette supports keyboard navigation, cancellation, focus restoration and RGB/hex custom colors", async () => {
  await render();
  await act(() => background().focus());
  await click(background());
  assert.equal(dialog().querySelector('[role="group"]').querySelectorAll('[aria-pressed]').length, 48);
  assert.equal(dialog().querySelectorAll('[aria-pressed]').length, 64);
  assert.equal(document.activeElement.getAttribute("aria-label"), "#008080");
  await key(document.activeElement, "ArrowRight");
  assert.equal(document.activeElement.getAttribute("aria-label"), "#004080");
  await click(document.activeElement);
  await key(document.activeElement, "Escape");
  assert.equal(dialog(), null);
  assert.equal(document.activeElement, background());
  assert.match(background().textContent, /#008080/);
  await click(background());
  const help = dialog().querySelector('[aria-label="Color picker help"]');
  await act(() => help.focus());
  await key(help, "Tab", { shiftKey: true });
  assert.equal(document.activeElement, button("Add to Custom Colors", dialog()));
  await key(document.activeElement, "Tab");
  assert.equal(document.activeElement, help);
  const hex = dialog().querySelector('[aria-label="Hex color"]');
  await input(hex, "#oops");
  assert.equal(button("OK", dialog()).disabled, true);
  assert.ok(dialog().querySelector('[role="alert"]'));
  await input(hex, "#123456");
  const [red, green, blue] = ["Red", "Green", "Blue"].map((label) => dialog().querySelector(`input[aria-label="${label}"]`));
  assert.deepEqual([red.value, green.value, blue.value], ["18", "52", "86"]);
  await input(red, "255");
  assert.equal(hex.value, "#FF3456");
  await click(button("OK", dialog()));
  assert.equal(dialog(), null);
  assert.match(background().textContent, /#FF3456/);
  assert.equal(saved(), null);
  await click(button("Apply"));
  assert.equal(css("--hoarder-background"), "#ff3456");
});


test("spectrum, luminance and HSL/RGB fields stay synchronized", async () => {
  await render();
  await click(background());
  const field = (name) => dialog().querySelector(`input[type="number"][aria-label="${name}"]`);
  const spectrum = dialog().querySelector('[aria-label="Hue and saturation"]');
  const luminance = dialog().querySelector('input[type="range"]');
  const hex = dialog().querySelector('[aria-label="Hex color"]');
  assert.deepEqual([field("Hue").value, field("Saturation").value, field("Luminance").value], ["120", "240", "60"]);
  await key(spectrum, "Home");
  assert.equal(field("Hue").value, "0");
  assert.equal(hex.value, "#800000");
  await key(spectrum, "ArrowRight", { shiftKey: true });
  assert.equal(field("Hue").value, "10");
  await key(spectrum, "ArrowDown");
  assert.equal(field("Saturation").value, "239");
  await input(field("Hue"), "0");
  await input(field("Saturation"), "240");
  await input(luminance, "120");
  assert.equal(hex.value, "#FF0000");
  assert.deepEqual([field("Red").value, field("Green").value, field("Blue").value], ["255", "0", "0"]);
  await input(luminance, "240");
  assert.equal(hex.value, "#FFFFFF");
  await input(luminance, "0");
  assert.equal(hex.value, "#000000");
  await input(luminance, "120");
  assert.equal(hex.value, "#FF0000");
});

test("custom colors can be saved, reused after reopening, and overwrite the selected slot", async () => {
  await render();
  await click(background());
  const hex = () => dialog().querySelector('[aria-label="Hex color"]');
  await input(hex(), "#123456");
  await click(button("Add to Custom Colors", dialog()));
  assert.ok(dialog().querySelector('[aria-label="Custom color 1: #123456"]'));
  await input(hex(), "#abcdef");
  await click(button("Add to Custom Colors", dialog()));
  await click(button("Cancel", dialog()));
  assert.match(background().textContent, /#008080/);
  await click(background());
  await click(dialog().querySelector('[aria-label="Custom color 1: #123456"]'));
  assert.equal(hex().value, "#123456");
  await input(hex(), "#654321");
  await click(button("Add to Custom Colors", dialog()));
  assert.ok(dialog().querySelector('[aria-label="Custom color 1: #654321"]'));
  assert.ok(dialog().querySelector('[aria-label="Custom color 2: #ABCDEF"]'));
  await click(button("OK", dialog()));
  await click(button("Apply"));
  assert.equal(css("--hoarder-background"), "#654321");
});

test("tabs support arrow keys and preserve drafts across panels", async () => {
  await render();
  await changeBackground("#123456");
  await key(tab("Background"), "ArrowRight");
  assert.equal(tab("Appearance").getAttribute("aria-selected"), "true");
  assert.equal(document.activeElement, tab("Appearance"));
  await key(document.activeElement, "Home");
  assert.equal(tab("Background").getAttribute("aria-selected"), "true");
  assert.match(background().textContent, /#123456/);
});

test("invalid stored settings fall back safely while valid fields are preserved", async () => {
  for (const [stored, expectedTheme, expectedBackground] of [
    ["{broken", "brick", "#008080"],
    ["null", "brick", "#008080"],
    [JSON.stringify({ theme: "toString", backgroundColor: "red" }), "brick", "#008080"],
    [JSON.stringify({ theme: "matrix", backgroundColor: "invalid" }), "matrix", "#008080"],
    [JSON.stringify({ theme: "missing", backgroundColor: "#abcdef" }), "brick", "#abcdef"],
  ]) {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, stored);
    await remount();
    assert.match(background().textContent, new RegExp(expectedBackground.toUpperCase()));
    await click(tab("Appearance"));
    assert.equal(theme().value, themeOptions.find(({ name }) => name === expectedTheme).label);
  }
});

test("appearance controls remain usable when browser storage is unavailable", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("Storage blocked"); } });
  try {
    await render();
    await changeTheme("matrix");
    await changeBackground("#654321");
    await click(button("Apply"));
    assert.equal(css("--r95-color-material"), tokens.matrix.colors.material);
    assert.equal(css("--hoarder-background"), "#654321");
  } finally {
    Object.defineProperty(globalThis, "localStorage", descriptor);
  }
});

test("wallpaper display modes preview, apply to the desktop and survive reopening", async () => {
  await render();
  assert.equal(desktopImage(), "none");
  assert.equal(container.querySelector("#wallpaper-display").disabled, true);
  await uploadWallpaper(wallpaperFile());
  assert.equal(container.querySelector("#desktop-wallpaper").value, "image");
  assert.match(container.querySelector("#desktop-wallpaper").textContent, /Wallpaper.png/);
  assert.match(previewImage(), /data:image\/png;base64,/);
  assert.equal(desktopImage(), "none");
  assert.equal(saved(), null);
  const previewSize = preview().style.getPropertyValue("--hoarder-wallpaper-size").split(" ").map(parseFloat);
  assert.ok(Math.abs(previewSize[0] - 100 / window.innerWidth) < 1e-10);
  assert.ok(Math.abs(previewSize[1] - 100 / window.innerHeight) < 1e-10);
  for (const [label, mode, repeat, size, position] of [
    ["Center", "center", "no-repeat", "1px 1px", "center center"],
    ["Tile", "tile", "repeat", "1px 1px", "left top"],
    ["Stretch", "stretch", "no-repeat", "100% 100%", "center center"],
    ["Fit horizontally", "fitWidth", "no-repeat", "100% auto", "center center"],
  ]) {
    await select(container.querySelector("#wallpaper-display"), label);
    if (mode === "fitWidth") assert.equal(preview().style.getPropertyValue("--hoarder-wallpaper-size"), "100% auto");
    await click(button("Apply"));
    assert.match(desktopImage(), /data:image\/png;base64,/);
    assert.equal(css("--hoarder-wallpaper-repeat"), repeat);
    assert.equal(css("--hoarder-wallpaper-size"), size);
    assert.equal(css("--hoarder-wallpaper-position"), position);
    assert.equal(saved().wallpaperMode, mode);
    assert.deepEqual(saved().wallpaper, { name: "Wallpaper.png", dataUrl: `data:image/png;base64,${PNG}`, width: 1, height: 1 });
    assert.equal(button("Apply").disabled, true);
  }
  await remount();
  assert.equal(container.querySelector("#wallpaper-display").value, "Fit horizontally");
  assert.equal(container.querySelector("#desktop-wallpaper").value, "image");
  assert.equal(css("--hoarder-wallpaper-size"), "100% auto");
});

test("large wallpaper data is applied directly to image properties instead of CSS custom properties", async () => {
  const dataUrl = `data:image/png;base64,${"A".repeat(2304000)}`;
  const wallpaper = { name: "large-wallpaper.png", dataUrl, width: 960, height: 600 };
  localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({
    theme: "brick", backgroundColor: "#008080", wallpaper, wallpaperMode: "stretch",
  }));
  await render();
  assert.equal(desktopImage(), `url("${dataUrl}")`);
  assert.equal(previewImage(), desktopImage());
  assert.equal(css("--hoarder-wallpaper"), "");
  assert.equal(preview().style.getPropertyValue("--hoarder-wallpaper"), "");
  await click(button("Reset to default"));
  assert.equal(previewImage(), "none");
  assert.equal(desktopImage(), `url("${dataUrl}")`);
  await click(button("Apply"));
  assert.equal(desktopImage(), "none");
});

test("wallpaper drafts persist across tabs, Cancel discards them, and None or Reset removes applied images", async () => {
  await render();
  await uploadWallpaper(wallpaperFile());
  await changeTheme("matrix");
  await click(tab("Background"));
  assert.equal(container.querySelector("#desktop-wallpaper").value, "image");
  await click(button("Cancel"));
  assert.equal(desktopImage(), "none");
  window.history.replaceState({}, "", "/settings");
  await remount();
  await uploadWallpaper(wallpaperFile());
  await click(button("OK"));
  assert.equal(window.location.pathname, "/");
  assert.match(desktopImage(), /data:image\/png;base64,/);
  window.history.replaceState({}, "", "/settings");
  await remount();
  await select(container.querySelector("#desktop-wallpaper"), "none");
  assert.equal(previewImage(), "none");
  assert.match(desktopImage(), /data:image\/png;base64,/);
  await select(container.querySelector("#desktop-wallpaper"), "image");
  assert.match(previewImage(), /data:image\/png;base64,/);
  await select(container.querySelector("#desktop-wallpaper"), "none");
  await click(button("Apply"));
  assert.equal(desktopImage(), "none");
  assert.equal(saved(), null);
  await uploadWallpaper(wallpaperFile());
  await select(container.querySelector("#wallpaper-display"), "Tile");
  await click(button("Apply"));
  await click(button("Reset to default"));
  assert.equal(previewImage(), "none");
  assert.match(desktopImage(), /data:image\/png;base64,/);
  await click(button("Apply"));
  assert.equal(desktopImage(), "none");
  assert.equal(css("--hoarder-wallpaper-repeat"), "no-repeat");
  assert.equal(saved(), null);
});

test("wallpaper rejects unsupported, oversized, empty and undecodable files without losing the selected image", async () => {
  await render();
  await uploadWallpaper(wallpaperFile());
  for (const [file, message] of [
    [new File(["text"], "notes.txt", { type: "text/plain" }), /Choose a PNG/],
    [new File([new Uint8Array(MAX_WALLPAPER_BYTES + 1)], "large.png", { type: "image/png" }), /up to 2 MB/],
    [new File([], "empty.png", { type: "image/png" }), /up to 2 MB/],
    [new File(["broken"], "broken.png", { type: "image/png" }), /could not be opened/],
  ]) {
    await uploadWallpaper(file);
    assert.match(settingsWindow().querySelector('[role="alert"]').textContent, message);
    assert.match(container.querySelector("#desktop-wallpaper").textContent, /Wallpaper.png/);
    assert.match(previewImage(), new RegExp(PNG.replace(/[+]/g, "\\+")));
    assert.equal(desktopImage(), "none");
  }
});

test("Reset cancels an in-flight wallpaper read and direct reads support abortion", async () => {
  await render();
  await act(async () => {
    Object.defineProperty(fileInput(), "files", { configurable: true, value: [wallpaperFile()] });
    fileInput().dispatchEvent(new Event("change", { bubbles: true }));
    button("Reset to default").click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  assert.equal(container.querySelector("#desktop-wallpaper").value, "none");
  assert.equal(button("Apply").disabled, true);
  assert.equal(settingsWindow().querySelector('[role="alert"]'), null);
  const controller = new AbortController();
  const reading = readWallpaper(wallpaperFile(), controller.signal);
  controller.abort();
  await assert.rejects(reading, { name: "AbortError" });
});

test("malformed saved wallpapers cannot introduce remote URLs or invalid display modes", async () => {
  for (const wallpaper of [
    { name: "remote", dataUrl: "https://example.com/image.png", width: 100, height: 100 },
    { name: "invalid", dataUrl: `data:image/png;base64,${PNG}`, width: -1, height: 100 },
    { name: "svg", dataUrl: "data:image/svg+xml;base64,PHN2Zz4=", width: 100, height: 100 },
  ]) {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: "matrix", backgroundColor: "#123456", wallpaper, wallpaperMode: "toString" }));
    await remount();
    assert.equal(desktopImage(), "none");
    assert.equal(css("--hoarder-wallpaper-repeat"), "no-repeat");
    assert.equal(css("--r95-color-material"), tokens.matrix.colors.material);
    assert.equal(css("--hoarder-background"), "#123456");
  }
});

test("a full browser store keeps wallpaper applied for the session and offers a save retry", async () => {
  await render();
  await uploadWallpaper(wallpaperFile());
  const originalSetItem = dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  try {
    await click(button("OK"));
    assert.equal(window.location.pathname, "/settings");
    assert.match(desktopImage(), /data:image\/png;base64,/);
    assert.match(settingsWindow().querySelector('[role="alert"]').textContent, /could not be saved/);
    assert.equal(button("Apply").disabled, false);
  } finally {
    dom.window.Storage.prototype.setItem = originalSetItem;
  }
  await click(button("Apply"));
  assert.equal(settingsWindow().querySelector('[role="alert"]'), null);
  assert.equal(button("Apply").disabled, true);
  assert.equal(saved().wallpaper.name, "Wallpaper.png");
});
