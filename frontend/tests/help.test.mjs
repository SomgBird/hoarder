import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h, StrictMode } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost", pretendToBeVisual: true });
for (const key of ["window", "document", "HTMLElement", "Event", "MouseEvent", "KeyboardEvent", "localStorage"]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.__APP_VERSION__ = "test";
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../src/App.tsx");
const { HELP_TOPICS, helpUrl } = await import("../src/config/help.ts");
const { helpArticles } = await import("../src/pages/Help/helpArticles.tsx");

let root, container, opened, printed;
const originalFetch = globalThis.fetch;
const originalOpen = window.open;
const originalPrint = window.print;
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/help");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  opened = [];
  printed = 0;
  window.open = (...args) => { opened.push(args); return null; };
  window.print = () => { printed++; };
  globalThis.fetch = async (url) => new URL(url).pathname === "/items/itemlist"
    ? Response.json({ items: [], total: 0, offset: 0, limit: 20 }) : Response.json([]);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  globalThis.fetch = originalFetch;
  window.open = originalOpen;
  window.print = originalPrint;
});

const render = () => act(async () => { root.render(h(StrictMode, null, h(App))); });
const heading = () => container.querySelector("#help-topic-title");
const topic = (id) => container.querySelector(`[data-help-topic="${id}"] label`);
const folder = (id) => container.querySelector(`[data-help-folder="${id}"]`);
const folderLabel = (id) => folder(id)?.querySelector(":scope > div > label");
const button = (text, scope = container) => [...scope.querySelectorAll("button")].find((node) => node.textContent.trim() === text);
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const key = (node, value) => act(async () => node.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true })));
const remountAt = async (url) => {
  await act(() => root.unmount());
  root = createRoot(container);
  window.history.replaceState({}, "", url);
  await render();
};
const assertHelpLink = (topicId, scope = container) => {
  const link = scope.querySelector(`a[href="${helpUrl(topicId, true)}"]`);
  assert.ok(link, `Help link for ${topicId}`);
  assert.equal(link.target, "hoarder-help");
  assert.ok(link.getAttribute("aria-label"));
  return link;
};

test("Help opens from the main menu with a React95 contents tree and documentation pane", async () => {
  window.history.replaceState({}, "", "/");
  await render();
  await click([...container.querySelectorAll("nav li")].find((node) => node.textContent === "Help"));
  assert.equal(window.location.pathname, "/help");
  assert.equal(heading().textContent, HELP_TOPICS.welcome);
  assert.deepEqual([...container.querySelectorAll('[data-help-folder]')].map((node) => node.querySelector("label").textContent),
    ["Getting started", "Collection", "Item pages", "Media", "Appearance"]);
  assert.ok(topic("welcome"));
  assert.equal(topic("collection"), null);
  assert.ok(container.querySelector('[role="tree"] svg'));
  assert.match(container.querySelector("article").textContent, /Getting started/);
  assert.equal(button("Back").disabled, true);
  assert.equal(button("Forward").disabled, true);
});

test("every topic supports direct links and displays its matching article and selected tree entry", async () => {
  for (const [id, title] of Object.entries(HELP_TOPICS)) {
    await remountAt(helpUrl(id));
    assert.equal(heading().textContent, title);
    assert.equal(container.querySelector('[role="treeitem"][aria-selected="true"]').getAttribute("data-help-topic"), id);
    assert.equal(topic(id).closest('[data-help-folder]').getAttribute("aria-expanded"), "true");
    assert.match(container.querySelector("article").textContent, new RegExp(helpArticles[id].introduction.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  await remountAt("/help?topic=toString");
  assert.equal(heading().textContent, HELP_TOPICS.welcome);
});

test("tree keyboard navigation, related topics and Back/Forward keep the article and URL together", async () => {
  await render();
  await act(() => folderLabel("collection").focus());
  await key(document.activeElement, "ArrowRight");
  assert.equal(folder("collection").getAttribute("aria-expanded"), "true");
  await key(document.activeElement, "ArrowRight");
  assert.equal(document.activeElement, topic("collection"));
  await key(document.activeElement, "Enter");
  assert.equal(heading().textContent, HELP_TOPICS.collection);
  assert.equal(new URLSearchParams(window.location.search).get("topic"), "collection");
  await click(topic("filters"));
  await click(button("Back"));
  assert.equal(heading().textContent, HELP_TOPICS.collection);
  await click(button("Forward"));
  assert.equal(heading().textContent, HELP_TOPICS.filters);
  await click(button("Collection Manager", container.querySelector("article")));
  assert.equal(heading().textContent, HELP_TOPICS.collection);
  await click(container.querySelector('[aria-label="Hide contents"]'));
  assert.equal(container.querySelector('[role="tree"]'), null);
  await click(container.querySelector('[aria-label="Show contents"]'));
  assert.ok(topic("collection"));
  await click(button("Print"));
  assert.equal(printed, 1);
});

test("folders expand and collapse with mouse or keyboard without changing the article", async () => {
  await render();
  const toggle = (id) => act(async () => folderLabel(id).dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
  await toggle("item-pages");
  assert.equal(folder("item-pages").getAttribute("aria-expanded"), "true");
  assert.ok(topic("new-item"));
  assert.equal(heading().textContent, HELP_TOPICS.welcome);
  await act(() => topic("new-item").focus());
  await key(document.activeElement, "ArrowLeft");
  assert.ok(document.activeElement === folderLabel("item-pages"));
  await key(document.activeElement, "ArrowLeft");
  assert.equal(folder("item-pages").getAttribute("aria-expanded"), "false");
  assert.equal(topic("new-item"), null);
  await key(document.activeElement, "Enter");
  assert.ok(topic("new-item"));
  await toggle("item-pages");
  assert.equal(topic("new-item"), null);
  for (const id of ["collection", "item-pages", "media", "appearance"]) await toggle(id);
  const topics = [...container.querySelectorAll('[data-help-topic]')].map((node) => node.getAttribute("data-help-topic"));
  assert.deepEqual(topics.sort(), Object.keys(HELP_TOPICS).sort());
  await click(topic("color-picker"));
  await toggle("appearance");
  assert.equal(topic("color-picker"), null);
  await click(button("Back"));
  await click(button("Forward"));
  assert.ok(topic("color-picker"));
  assert.equal(folder("appearance").getAttribute("aria-expanded"), "true");
});

test("context Help has a standalone layout and preserves its topic while browsing", async () => {
  await remountAt(helpUrl("color-picker", true));
  assert.equal(container.querySelector('[aria-label="Main navigation"]'), null);
  assert.equal(heading().textContent, HELP_TOPICS["color-picker"]);
  await click(topic("settings"));
  assert.equal(new URLSearchParams(window.location.search).get("window"), "1");
  assert.equal(heading().textContent, HELP_TOPICS.settings);
});

test("Help links target the relevant sections from Settings, the color dialog, About and the new item wizard", async () => {
  await remountAt("/settings");
  assertHelpLink("settings");
  await click(container.querySelector("#system-background"));
  const picker = document.querySelector('[role="dialog"][aria-label="Color"]');
  const link = assertHelpLink("color-picker", picker);
  link.addEventListener("click", (event) => event.preventDefault(), { once: true });
  await click(link);
  assert.ok(picker.isConnected);
  assert.equal(window.location.pathname, "/settings");
  await remountAt("/");
  assertHelpLink("about");
  await remountAt("/page-editor");
  assertHelpLink("new-item");
});

test("Collection Manager, filters, Explorer menu and toolbar open their matching help topics", async () => {
  await remountAt("/collection-view");
  assertHelpLink("collection");
  assertHelpLink("explorer");
  await click(button("Filter"));
  assertHelpLink("filters", document.querySelector('[aria-label="Filter collection"]'));
  await click(button("Cancel"));
  const menubar = container.querySelector('[role="menubar"]');
  await click(button("Help", menubar));
  await click(button("Help topics…", menubar));
  await click(button("Help", container.querySelector('[role="toolbar"][data-label-position]') ?? container.querySelectorAll('[role="toolbar"]')[1]));
  assert.deepEqual(opened, [[helpUrl("explorer", true), "hoarder-help"], [helpUrl("explorer", true), "hoarder-help"]]);
  assert.equal(window.location.pathname, "/collection-view");
  await remountAt("/media-viewer");
  assertHelpLink("media");
});
