import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h, StrictMode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { existingItem } from "./fixtures/item.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost", pretendToBeVisual: true });
for (const key of ["window", "document", "HTMLElement", "Event", "MouseEvent", "KeyboardEvent"]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { CollectionView } = await import("../src/pages/CollectionView/CollectionView.tsx");
const { default: MenuBar } = await import("../src/components/MenuBar/MenuBar.tsx");

let root, container, items, calls, failDelete, failLoad, holdDelete, finishDelete;
const originalFetch = globalThis.fetch;
beforeEach(() => {
  items = new Map([[42, structuredClone(existingItem)], [43, { ...structuredClone(existingItem), id: 43, display_title: "Second item" }]]);
  calls = [];
  failDelete = failLoad = holdDelete = false;
  finishDelete = null;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method ?? "GET";
    calls.push({ path, method });
    if (path === "/items/itemlist") return Response.json({
      items: [...items.values()].map((item) => ({ id: item.id, title: item.display_title, release_date: item.release_date })),
      total: items.size, offset: 0, limit: 20,
    });
    const id = Number(path.split("/").at(-1));
    if (method === "DELETE") {
      if (holdDelete) await new Promise((resolve) => { finishDelete = resolve; });
      if (failDelete) return Response.json({ detail: "Server refused deletion" }, { status: 500 });
      items.delete(id);
      return new Response(null, { status: 204 });
    }
    if (failLoad || !items.has(id)) return Response.json({ detail: "Item not found" }, { status: 404 });
    return Response.json(items.get(id));
  };
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  globalThis.fetch = originalFetch;
});

function Destination() {
  const location = useLocation();
  return h("output", null, `${location.pathname}${location.search}`);
}
const render = (element) => act(async () => { root.render(element); });
const explorer = (path = "/collection-view") => h(MemoryRouter, { initialEntries: [path] }, h(Routes, null,
  h(Route, { path: "/collection-view", element: h(CollectionView) }),
  h(Route, { path: "/page-editor", element: h(Destination) }),
  h(Route, { path: "/", element: h(Destination) })));
const find = (selector, text, scope = container) => [...scope.querySelectorAll(selector)].find((node) => node.textContent.trim() === text);
const menu = (text) => find('[role="menubar"] > [role="none"] > button', text);
const command = (text) => find('[role="menu"] button', text);
const button = (text, scope = container) => find("button", text, scope);
const dialog = () => container.querySelector('[role="alertdialog"]');
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const key = (node, value, options = {}) => act(async () => {
  node.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options }));
});
const run = async (top, action) => { await click(menu(top)); await click(command(action)); };
const deletes = () => calls.filter((call) => call.method === "DELETE");
const select = (id) => click([...container.querySelectorAll('button[aria-current]')].find((node) => node.textContent.startsWith(items.get(id).display_title)));

test("menus expose available actions and disable item actions on the home page", async () => {
  await render(explorer());
  assert.deepEqual([...container.querySelectorAll('[role="menubar"] [aria-haspopup="menu"]')].map((node) => node.textContent), ["File", "Edit", "View", "Go", "Help"]);
  await click(menu("File"));
  assert.equal(command("Delete item…").disabled, true);
  await click(command("Delete item…"));
  assert.equal(dialog(), null);
  await click(menu("Edit"));
  assert.equal(command("Edit page…").disabled, true);
  await click(menu("Go"));
  assert.equal(command("Back").disabled, true);
  assert.equal(command("Forward").disabled, true);
  await run("File", "New page…");
  assert.equal(container.querySelector("output").textContent, "/page-editor");
});

test("Go navigates explorer history and Refresh reloads both the page and collection", async () => {
  await render(explorer());
  await select(42);
  await select(43);
  await run("Go", "Back");
  assert.equal(container.querySelector("h1").textContent, "Original title");
  await run("Go", "Forward");
  assert.equal(container.querySelector("h1").textContent, "Second item");
  const listsBefore = calls.filter((call) => call.path === "/items/itemlist").length;
  items.get(43).display_title = "Refreshed item";
  await run("View", "Refresh");
  assert.equal(container.querySelector("h1").textContent, "Refreshed item");
  assert.equal(calls.filter((call) => call.path === "/items/itemlist").length, listsBefore + 1);
  assert.ok(button("Refreshed item"));
  await run("Go", "Home");
  assert.equal(container.querySelector("h1").textContent, "Welcome to your collection");
});

test("Edit and About menu commands open their existing destinations", async () => {
  await render(explorer("/collection-view?itemId=42"));
  await run("Edit", "Edit page…");
  assert.equal(container.querySelector("output").textContent, "/page-editor?itemId=42");
  // Remount the router to exercise the independent About action.
  await render(h("div", { key: "about" }, explorer()));
  await run("Help", "About Hoarder…");
  assert.equal(container.querySelector("output").textContent, "/");
});

test("deletion requires confirmation, focuses Cancel, traps focus, and Escape cancels", async () => {
  await render(explorer("/collection-view?itemId=42"));
  await run("File", "Delete item…");
  assert.match(dialog().textContent, /Original title/);
  assert.match(dialog().textContent, /cannot be undone/);
  assert.equal(document.activeElement, button("Cancel", dialog()));
  assert.equal(deletes().length, 0);
  await key(document.activeElement, "Tab");
  assert.equal(document.activeElement, button("Delete item", dialog()));
  await key(document.activeElement, "Tab", { shiftKey: true });
  assert.equal(document.activeElement, button("Cancel", dialog()));
  await key(document.activeElement, "Escape");
  assert.equal(dialog(), null);
  assert.equal(deletes().length, 0);
  assert.equal(document.activeElement, menu("File"));
  await run("File", "Delete item…");
  await click(button("Cancel", dialog()));
  assert.equal(dialog(), null);
  assert.equal(deletes().length, 0);
});

test("Cancel remains the default focus with the application's Strict Mode enabled", async () => {
  await render(h(StrictMode, null, explorer("/collection-view?itemId=42")));
  await run("File", "Delete item…");
  assert.equal(document.activeElement, button("Cancel", dialog()));
  await key(document.activeElement, "Escape");
  assert.equal(dialog(), null);
  assert.equal(deletes().length, 0);
});

test("confirmed deletion refreshes the list, returns home, and removes all history references", async () => {
  await render(explorer());
  await select(42);
  await select(43);
  await select(42);
  await run("File", "Delete item…");
  await click(button("Delete item", dialog()));
  assert.deepEqual(deletes(), [{ path: "/items/42", method: "DELETE" }]);
  assert.equal(dialog(), null);
  assert.equal(container.querySelector("h1").textContent, "Welcome to your collection");
  assert.equal(container.querySelectorAll('button[aria-current]').length, 1);
  await run("Go", "Back");
  assert.equal(container.querySelector("h1").textContent, "Second item");
  await run("Go", "Back");
  assert.equal(container.querySelector("h1").textContent, "Welcome to your collection");
});

test("failed deletion keeps the item and dialog and permits an explicit retry", async () => {
  await render(explorer("/collection-view?itemId=42"));
  await run("File", "Delete item…");
  failDelete = true;
  await click(button("Delete item", dialog()));
  assert.match(dialog().querySelector('[role="alert"]').textContent, /Server refused deletion/);
  assert.equal(items.has(42), true);
  assert.equal(button("Delete item", dialog()).disabled, false);
  failDelete = false;
  await click(button("Delete item", dialog()));
  assert.equal(deletes().length, 2);
  assert.equal(dialog(), null);
});

test("a pending delete blocks duplicate requests and dismissal", async () => {
  await render(explorer("/collection-view?itemId=42"));
  await run("File", "Delete item…");
  holdDelete = true;
  await click(button("Delete item", dialog()));
  assert.equal(button("Deleting…", dialog()).disabled, true);
  assert.equal(button("Cancel", dialog()).disabled, true);
  await click(button("Deleting…", dialog()));
  await key(document.activeElement, "Escape");
  assert.ok(dialog());
  assert.equal(deletes().length, 1);
  await act(async () => finishDelete());
  assert.equal(dialog(), null);
});

test("an item must load successfully before deletion can be confirmed", async () => {
  await render(explorer("/collection-view?itemId=42"));
  failLoad = true;
  await run("File", "Delete item…");
  assert.match(dialog().querySelector('[role="alert"]').textContent, /Item not found/);
  assert.equal(button("Delete item", dialog()).disabled, true);
  assert.equal(deletes().length, 0);
  failLoad = false;
  await click(button("Retry", dialog()));
  assert.equal(button("Delete item", dialog()).disabled, false);
  assert.match(dialog().textContent, /Original title/);
});

test("menubar keyboard controls support mnemonics, arrows, disabled entries, and dismissal", async () => {
  const actions = [];
  await render(h(MenuBar, { items: [
    { label: "File", mnemonicIndex: 0, entries: [
      { label: "Unavailable", disabled: true, onClick: () => assert.fail("Disabled action") },
      { label: "New", mnemonicIndex: 0, onClick: () => actions.push("new") },
      { separator: true },
      { label: "Delete…", mnemonicIndex: 0, onClick: () => actions.push("delete-dialog") },
    ] },
    { label: "Edit", mnemonicIndex: 0, entries: [{ label: "Edit page", onClick: () => actions.push("edit") }] },
  ] }));
  await key(document.body, "f", { altKey: true });
  assert.equal(document.activeElement, command("New"));
  await key(document.activeElement, "ArrowDown");
  assert.equal(document.activeElement, command("Delete…"));
  await key(document.activeElement, "ArrowDown");
  assert.equal(document.activeElement, command("New"));
  await key(document.activeElement, "End");
  assert.equal(document.activeElement, command("Delete…"));
  await key(document.activeElement, "Home");
  assert.equal(document.activeElement, command("New"));
  await key(document.activeElement, "ArrowRight");
  assert.equal(document.activeElement, command("Edit page"));
  await key(document.activeElement, "ArrowLeft");
  await key(document.activeElement, "d");
  assert.deepEqual(actions, ["delete-dialog"]);
  assert.equal(container.querySelector('[role="menu"]'), null);
  assert.equal(document.activeElement, menu("File"));
  await key(menu("File"), "ArrowUp");
  assert.equal(document.activeElement, command("Delete…"));
  await key(document.activeElement, "Escape");
  assert.equal(document.activeElement, menu("File"));
  await click(menu("File"));
  await act(async () => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
  assert.equal(container.querySelector('[role="menu"]'), null);
});
