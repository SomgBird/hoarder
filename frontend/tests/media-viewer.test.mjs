import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h, StrictMode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost", pretendToBeVisual: true });
for (const key of ["window", "document", "HTMLElement", "Event", "MouseEvent", "KeyboardEvent"]) globalThis[key] = dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { MediaViewer } = await import("../src/pages/MediaViewer/MediaViewer.tsx");
const { NavBar } = await import("../src/components/NavBar/NavBar.tsx");
const { routes } = await import("../src/config/navigation.tsx");

const originalFetch = globalThis.fetch;
let root, container, files, calls, failList;
beforeEach(() => {
  files = [
    { name: "cover.png", relative_path: "covers/cover.png", path: "/media/covers/cover.png", size_bytes: 1000 },
    { name: "icon.ico", relative_path: "icons/icon.ico", path: "/media/icons/icon.ico", size_bytes: 400 },
  ];
  calls = [];
  failList = false;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  globalThis.fetch = async (url, options) => {
    calls.push({ url, signal: options.signal });
    return failList ? Response.json({ detail: "Media unavailable" }, { status: 500 }) : Response.json(files);
  };
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  globalThis.fetch = originalFetch;
});

const render = (element = h(MediaViewer)) => act(async () => root.render(element));
const button = (text, scope = document.body) => [...scope.querySelectorAll("button")].find((node) => node.textContent.trim() === text);
const file = (path) => container.querySelector(`button[aria-label="${path}"]`);
const dialog = () => document.querySelector('[role="dialog"]');
const close = () => dialog().querySelector('[aria-label="Close image"]');
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const doubleClick = (node) => act(async () => node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
const key = (node, value, options = {}) => act(async () => node.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options })));

test("Media Viewer navigation leads to the registered page and lists 64px thumbnails", async () => {
  assert.ok(routes.find((route) => route.path === "/media-viewer"));
  await render(h(MemoryRouter, null,
    h(NavBar), h(Routes, null,
      h(Route, { path: "/", element: h("p", null, "Home") }),
      h(Route, { path: "/media-viewer", element: h(MediaViewer) }))));
  const nav = [...container.querySelectorAll("nav li")].find((node) => node.textContent.trim() === "Media Viewer");
  await click(nav);
  assert.equal(new URL(calls[0].url).pathname, "/media/");
  assert.equal(container.querySelectorAll('[aria-label="Media files"] li').length, 2);
  for (const thumbnail of container.querySelectorAll('[aria-label="Media files"] img')) {
    assert.equal(thumbnail.width, 64);
    assert.equal(thumbnail.height, 64);
  }
  assert.match(container.textContent, /2 files/);
});

test("single click selects and double click opens the original image in a closable React95 window", async () => {
  await render();
  const thumbnail = file("covers/cover.png");
  await click(thumbnail);
  assert.equal(thumbnail.getAttribute("aria-current"), "true");
  assert.equal(dialog(), null);
  await doubleClick(thumbnail);
  assert.equal(dialog().getAttribute("aria-modal"), "true");
  assert.equal(dialog().getAttribute("aria-label"), "Image: covers/cover.png");
  const image = dialog().querySelector('[aria-label="Full size image"] img');
  assert.match(image.src, /\/media\/covers\/cover.png$/);
  assert.equal(image.getAttribute("width"), null);
  assert.equal(image.getAttribute("height"), null);
  assert.equal(document.activeElement, close());
  await click(close());
  assert.equal(dialog(), null);
  assert.equal(document.activeElement, thumbnail);
});

test("Enter opens an image, focus stays inside the popup, and Escape closes it in Strict Mode", async () => {
  await render(h(StrictMode, null, h(MediaViewer)));
  const thumbnail = file("icons/icon.ico");
  thumbnail.focus();
  await key(thumbnail, "Enter");
  const viewport = dialog().querySelector('[aria-label="Full size image"]');
  assert.equal(document.activeElement, close());
  await key(close(), "Tab", { shiftKey: true });
  assert.equal(document.activeElement, viewport);
  await key(viewport, "Tab");
  assert.equal(document.activeElement, close());
  await key(close(), "Escape");
  assert.equal(dialog(), null);
  assert.equal(document.activeElement, thumbnail);
});

test("thumbnail and full image failures keep the viewer usable and offer image retry", async () => {
  await render();
  const thumbnail = file("covers/cover.png");
  await act(async () => thumbnail.querySelector("img").dispatchEvent(new Event("error")));
  assert.ok(thumbnail.querySelector("svg"));
  await doubleClick(thumbnail);
  await act(async () => dialog().querySelector('[aria-label="Full size image"] img').dispatchEvent(new Event("error")));
  assert.match(dialog().querySelector('[role="alert"]').textContent, /Could not load image/);
  await click(button("Retry", dialog()));
  assert.ok(dialog().querySelector('[aria-label="Full size image"] img'));
  await click(close());
  assert.equal(dialog(), null);
});

test("list errors retry, empty folders render a message, and Refresh loads new files", async () => {
  failList = true;
  await render();
  assert.match(container.querySelector('[role="alert"]').textContent, /Media unavailable/);
  failList = false;
  files = [];
  await click(button("Retry"));
  assert.match(container.textContent, /No media yet/);
  assert.match(container.textContent, /0 files/);
  files = [{ name: "new.png", relative_path: "new.png", path: "/media/new.png", size_bytes: 20 }];
  await click(button("Refresh"));
  assert.ok(file("new.png"));
  assert.match(container.textContent, /1 file/);
});

test("pending loads expose a loading state and abort when leaving the page", async () => {
  let signal;
  globalThis.fetch = async (_url, options) => {
    signal = options.signal;
    return new Promise(() => {});
  };
  await render();
  assert.match(container.textContent, /Loading media/);
  assert.equal(button("Refresh").disabled, true);
  await render(h("p", null, "Another page"));
  assert.equal(signal.aborted, true);
});
