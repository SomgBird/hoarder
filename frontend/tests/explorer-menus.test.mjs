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
  h(Route, { path: "/copy-editor", element: h(Destination) }),
  h(Route, { path: "/", element: h(Destination) })));
const find = (selector, text, scope = container) => [...scope.querySelectorAll(selector)].find((node) => node.textContent.trim() === text);
const menu = (text) => find('[role="menubar"] > [role="none"] > button', text);
const command = (text) => find('[role="menu"] button', text);
const button = (text, scope = container) => find("button", text, scope);
const dialog = () => container.querySelector('[role="alertdialog"]');
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const doubleClick = (node) => act(async () => {
  assert.ok(node);
  node.click();
  node.click();
  node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 }));
});
const key = (node, value, options = {}) => act(async () => {
  node.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options }));
});
const run = async (top, action) => { await click(menu(top)); await click(command(action)); };
const deletes = () => calls.filter((call) => call.method === "DELETE");
const itemButton = (id) => [...container.querySelectorAll('button[aria-current]')].find((node) => node.textContent.startsWith(items.get(id).display_title));
const openItem = (id) => doubleClick(itemButton(id));

test("authored pages recover on Refresh, offer creation when empty and reopen articles by ID", async () => {
  const fetchOther = globalThis.fetch;
  let list = null;
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    if (path === "/articles/") return list === null
      ? Response.json({ detail: "Try again" }, { status: 503 }) : Response.json(list);
    if (path === "/franchise-pages/") return Response.json([{ id: 7, title: "Existing franchise" }]);
    if (path === "/franchise-pages/7") return Response.json({
      id: 7, title: "Existing franchise", introduction: "Field guide.",
      members: [{ id: 42, title: items.get(42).display_title, item_type: "book" }],
    });
    if (path === "/articles/7") return Response.json({ id: 7, title: "Catalog notes", blocks: [] });
    return fetchOther(url, options);
  };
  await render(explorer());
  await click(find("a", "Authored pages"));
  assert.equal(container.querySelector("h1").textContent, "Could not load authored pages");
  list = [];
  await run("View", "Refresh");
  assert.ok(find("p", "No articles yet."));
  assert.equal(find("a", "Create an article…").getAttribute("href"), "/page-editor?new=article");
  list.push({ id: 7, title: "Catalog notes" });
  await run("View", "Refresh");
  const link = find("a", "Catalog notes");
  assert.equal(link.getAttribute("href"), "/collection-view?articleId=7");
  await click(link);
  const address = container.querySelector("label[for]").control;
  assert.equal(address.value, "collection://article/7");
  await run("Go", "Back");
  assert.equal(address.value, "collection://pages");
  await run("Go", "Forward");
  assert.equal(container.querySelector("h1").textContent, "Catalog notes");
  await run("Go", "Back");
  const franchise = find("a", "Existing franchise");
  assert.equal(franchise.getAttribute("href"), "/collection-view?franchiseId=7");
  await click(franchise);
  assert.equal(address.value, "collection://franchise/7");
  const member = find("a", items.get(42).display_title, container.querySelector("article"));
  assert.match(member.closest("li").textContent, /\(Book\)/);
  await click(member);
  assert.equal(address.value, "collection://item/42");
  assert.equal(find("a", "Existing franchise").getAttribute("href"), "/collection-view?franchiseId=7");
  await run("Go", "Back");
  assert.equal(address.value, "collection://franchise/7");
  assert.ok(find("p", "Field guide."));
});

test("an invalid address stays editable and never loads a rounded or zero item number", async () => {
  await render(explorer());
  const address = container.querySelector("label[for]").control;
  assert.equal(address.labels[0].textContent, "Address");
  const setValue = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  for (const value of ["collection://item/9007199254740993", "collection://item/0", "collection://item/1e2"]) {
    await act(async () => {
      setValue.call(address, value);
      address.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await key(address, "Enter");
    assert.equal(address.value, value);
    assert.equal(container.querySelector("h1").textContent, "Cannot find page");
  }
  assert.equal(calls.some(({ path }) => /^\/items\/\d/.test(path)), false);
  const homeLink = find("a", "Go to the home page");
  assert.equal(homeLink.getAttribute("href"), "/collection-view");
  await click(homeLink);
  assert.equal(address.value, "collection://home");
  await run("Go", "Back");
  assert.equal(container.querySelector("h1").textContent, "Cannot find page");
});

test("menus expose available actions and disable item actions on the home page", async () => {
  await render(explorer());
  assert.deepEqual([...container.querySelectorAll('[role="menubar"] [aria-haspopup="menu"]')].map((node) => node.textContent), ["File", "Edit", "View", "Go", "Help"]);
  await click(menu("File"));
  assert.equal(command("Delete item…").disabled, true);
  await click(command("Delete item…"));
  assert.equal(dialog(), null);
  await click(menu("Edit"));
  assert.equal(command("Edit page…").disabled, true);
  assert.equal(command("Edit copies…").disabled, true);
  assert.equal(button("Copies").disabled, true);
  await click(menu("Go"));
  assert.equal(command("Back").disabled, true);
  assert.equal(command("Forward").disabled, true);
  await run("File", "New page…");
  assert.equal(container.querySelector("output").textContent, "/page-editor");
});

test("Go navigates explorer history and Refresh reloads both the page and collection", async () => {
  await render(explorer());
  await openItem(42);
  await openItem(43);
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

test("every item view selects on single click and opens the explorer on double-click or Enter", async () => {
  for (const view of ["Table", "List", "Icons", "Mini pages"]) {
    await render(h("div", { key: view }, explorer()));
    await click([...container.querySelectorAll('[role="menuitemradio"]')].find((node) => node.textContent.trim().endsWith(view)));
    const itemLoads = (id) => calls.filter((call) => call.path === `/items/${id}`).length;
    const firstLoads = itemLoads(42);
    await click(itemButton(42));
    assert.equal(itemButton(42).getAttribute("aria-current"), "true", view);
    assert.equal(container.querySelector("h1").textContent, "Welcome to your collection", view);
    assert.equal(itemLoads(42), firstLoads, view);

    // In table mode any cell can open the item, including its dates.
    await doubleClick(view === "Table" ? itemButton(42).closest("tr").lastElementChild : itemButton(42));
    assert.equal(container.querySelector("h1").textContent, "Original title", view);
    assert.equal(itemLoads(42), firstLoads + 1, view);
    const secondLoads = itemLoads(43);
    await click(itemButton(43));
    assert.equal(itemButton(43).getAttribute("aria-current"), "true", view);
    assert.equal(itemButton(42).getAttribute("aria-current"), "false", view);
    assert.equal(container.querySelector("h1").textContent, "Original title", view);
    assert.equal(itemLoads(43), secondLoads, view);

    await key(itemButton(43), "Enter");
    assert.equal(container.querySelector("h1").textContent, "Second item", view);
    assert.equal(itemLoads(43), secondLoads + 1, view);
    await run("Go", "Back");
    assert.equal(container.querySelector("h1").textContent, "Original title", view);
    assert.equal(itemButton(42).getAttribute("aria-current"), "true", view);
    await run("Go", "Back");
    assert.equal(container.querySelector("h1").textContent, "Welcome to your collection", view);
    assert.equal(itemButton(42).getAttribute("aria-current"), "false", view);
    assert.equal(itemButton(43).getAttribute("aria-current"), "false", view);
  }
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

test("both copies commands open the displayed item even when a different collection row is selected", async () => {
  for (const entry of ["menu", "toolbar"]) {
    await render(h("div", { key: entry }, explorer("/collection-view?itemId=42")));
    await click(itemButton(43));
    if (entry === "menu") await run("Edit", "Edit copies…");
    else await click(button("Copies"));
    assert.equal(container.querySelector("output").textContent, "/copy-editor?itemId=42");
  }
});

test("deletion requires confirmation, focuses Cancel, traps focus, and Escape cancels", async () => {
  await render(explorer("/collection-view?itemId=42"));
  await run("File", "Delete item…");
  assert.match(dialog().textContent, /Original title/);
  assert.match(dialog().textContent, /cannot be undone/);
  assert.equal(document.activeElement, button("Cancel", dialog()));
  assert.equal(deletes().length, 0);
  await key(document.activeElement, "Tab");
  assert.equal(document.activeElement, dialog().querySelector('[aria-label="Help: Deleting an item"]'));
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
  await openItem(42);
  await openItem(43);
  await openItem(42);
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
