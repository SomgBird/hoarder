import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h, StrictMode } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "HTMLElement", "Event", "MouseEvent", "KeyboardEvent", "localStorage"]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.__APP_VERSION__ = "test";
const { tokens } = await import("@react95/core");
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../src/App.tsx");
const { APPEARANCE_STORAGE_KEY, themeOptions } = await import("../src/config/appearance.ts");

let root, container;
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("style");
  window.history.replaceState({}, "", "/settings");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

const render = () => act(async () => { root.render(h(StrictMode, null, h(App))); });
const settingsWindow = () => container.querySelector('[aria-label="Display Properties"]');
const theme = () => container.querySelector("#react95-theme");
const background = () => container.querySelector("#system-background");
const dialog = () => document.querySelector('[role="dialog"][aria-label="Color"]');
const preview = () => container.querySelector('[aria-label="Appearance preview"]');
const button = (text, scope = settingsWindow()) => [...scope.querySelectorAll("button")]
  .find((node) => node.textContent.trim() === text && !node.closest('[aria-hidden="true"]'));
const tab = (title) => container.querySelector(`[role="tab"][title="${title}"]`)
  ?? [...container.querySelectorAll('[role="tab"]')].find((node) => node.textContent === title);
const css = (property) => document.documentElement.style.getPropertyValue(property);
const saved = () => JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY));
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
    assert.deepEqual(saved(), { theme: name, backgroundColor: "#123456" });
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
