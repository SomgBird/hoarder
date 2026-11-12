import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "HTMLElement", "Event", "KeyboardEvent"]) {
  globalThis[key] = dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { default: CollectionManager } = await import("../src/components/CollectionManager/CollectionManager.tsx");

const originalFetch = globalThis.fetch;
let root, container, items, calls, failLoad, selectedItemId, refreshKey;
beforeEach(() => {
  items = [
    { id: 1, title: "First item", release_date: "2001-02-03", date_added: "2026-11-12", icon_image_path: "/media/covers/icon.png", item_type: "book", is_owned: true },
    { id: 2, title: "Second item", release_date: null, date_added: null, icon_image_path: null, item_type: "game", is_owned: false },
  ];
  calls = [];
  failLoad = false;
  selectedItemId = null;
  refreshKey = 0;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (failLoad) return Response.json({ detail: "Cannot load collection" }, { status: 500 });
    const params = new URL(url).searchParams;
    const offset = Number(params.get("offset"));
    const limit = Number(params.get("limit"));
    return Response.json({ items: items.slice(offset, offset + limit), total: items.length, offset, limit });
  };
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  globalThis.fetch = originalFetch;
});

function manager() {
  return h(CollectionManager, { selectedItemId, refreshKey, onSelectItem: (id) => {
    selectedItemId = id;
    root.render(manager());
  } });
}
const render = () => act(async () => root.render(manager()));
const button = (title) => [...container.querySelectorAll("button")].find((node) => node.textContent.trim() === title);
const option = (title) => [...container.querySelectorAll('[role="menuitemradio"]')].find((node) => node.textContent.replace("✓", "").trim() === title);
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const collection = () => container.querySelector('[aria-label="Collection items"]');

test("table shows three columns without icons, nullable dates, and selects from any cell", async () => {
  await render();
  assert.equal(option("Table").getAttribute("aria-checked"), "true");
  assert.deepEqual([...collection().querySelectorAll("th")].map((node) => node.textContent), ["Title", "Release date", "Date added"]);
  assert.equal(collection().querySelector("img, svg"), null);
  const rows = collection().querySelectorAll("tbody tr");
  assert.deepEqual([...rows[0].querySelectorAll("td")].map((node) => node.textContent), ["First item", "2001-02-03", "2026-11-12"]);
  assert.deepEqual([...rows[1].querySelectorAll("td")].map((node) => node.textContent), ["Second item", "—", "—"]);
  await click(rows[0].lastElementChild);
  assert.equal(selectedItemId, 1);
  assert.equal(button("First item").getAttribute("aria-current"), "true");
});

test("view switching retains selection without fetching and renders small and large icons with names", async () => {
  await render();
  await click(button("First item"));
  await click(option("List"));
  assert.equal(option("List").getAttribute("aria-checked"), "true");
  assert.equal(collection().tagName, "UL");
  assert.equal(collection().querySelector("time"), null);
  assert.equal(button("First item").getAttribute("aria-current"), "true");
  assert.equal(button("First item").querySelector("img").width, 16);
  assert.match(button("First item").querySelector("img").src, /\/media\/covers\/icon.png$/);
  assert.ok(button("Second item").querySelector("svg"));
  await act(async () => option("Icons").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
  assert.equal(option("Icons").getAttribute("aria-checked"), "true");
  assert.equal(button("First item").querySelector("img").width, 32);
  await click(button("Second item"));
  assert.equal(selectedItemId, 2);
  await click(option("Table"));
  assert.equal(button("Second item").getAttribute("aria-current"), "true");
  assert.equal(calls.length, 1);
});

test("broken item icons fall back to a file icon and recover when the image changes", async () => {
  await render();
  await click(option("Icons"));
  await act(async () => button("First item").querySelector("img").dispatchEvent(new Event("error")));
  assert.equal(button("First item").querySelector("img"), null);
  assert.ok(button("First item").querySelector("svg"));
  items[0].icon_image_path = "/media/covers/replacement.png";
  refreshKey++;
  await render();
  assert.match(button("First item").querySelector("img").src, /replacement.png$/);
});

test("pagination and refresh retain the current view", async () => {
  items = Array.from({ length: 23 }, (_, index) => ({ ...items[0], id: index + 1, title: `Item ${index + 1}` }));
  await render();
  await click(option("List"));
  await click(button("Next"));
  assert.equal(collection().querySelectorAll("li").length, 3);
  assert.ok(button("Item 21"));
  assert.equal(button("Next").disabled, true);
  assert.match(container.textContent, /21–23 of 23/);
  items[20].title = "Refreshed item";
  refreshKey++;
  await render();
  assert.ok(button("Refreshed item"));
  assert.equal(option("List").getAttribute("aria-checked"), "true");
  await click(button("Previous"));
  assert.ok(button("Item 1"));
  assert.equal(button("Previous").disabled, true);
});

test("load errors can retry and an empty collection keeps view choices available", async () => {
  failLoad = true;
  await render();
  assert.match(container.querySelector('[role="alert"]').textContent, /Cannot load collection/);
  await click(option("Icons"));
  failLoad = false;
  items = [];
  await click(button("Retry"));
  assert.match(container.textContent, /No items yet/);
  assert.match(container.textContent, /0 items/);
  assert.equal(collection(), null);
  assert.equal(option("Icons").getAttribute("aria-checked"), "true");
});

test("mini pages show a 64px icon, item type, ownership and dates while keeping selection", async () => {
  await render();
  await click(button("First item"));
  await click(option("Mini pages"));
  assert.equal(option("Mini pages").getAttribute("aria-checked"), "true");
  assert.equal(option("Icons").getAttribute("aria-checked"), "false");
  const cards = collection().querySelectorAll("li > button");
  assert.equal(cards.length, 2);
  assert.equal(cards[0].getAttribute("aria-current"), "true");
  assert.equal(cards[0].querySelector("img").width, 64);
  assert.equal(cards[0].querySelector("img").height, 64);
  assert.match(cards[0].textContent, /First item/);
  assert.match(cards[0].textContent, /Book · Owned/);
  assert.match(cards[0].textContent, /Release date: 2001-02-03/);
  assert.match(cards[0].textContent, /Date added: 2026-11-12/);
  assert.match(cards[1].textContent, /Video game · Not owned/);
  assert.match(cards[1].textContent, /Release date: —/);
  assert.match(cards[1].textContent, /Date added: —/);
  assert.equal(cards[1].querySelector("svg").getAttribute("width"), "64");
  await click(cards[1]);
  assert.equal(selectedItemId, 2);
  await click(option("Icons"));
  assert.equal(button("Second item").getAttribute("aria-current"), "true");
  assert.equal(calls.length, 1);
});

test("mini pages keep their layout during pagination and refresh, with a fallback for broken icons", async () => {
  items = Array.from({ length: 23 }, (_, index) => ({ ...items[0], id: index + 1, title: `Item ${index + 1}` }));
  await render();
  await act(async () => option("Mini pages").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true })));
  await click(button("Next"));
  assert.equal(collection().querySelectorAll("li").length, 3);
  const card = collection().querySelector("button");
  assert.match(card.textContent, /Item 21/);
  await act(async () => card.querySelector("img").dispatchEvent(new Event("error")));
  assert.equal(card.querySelector("img"), null);
  assert.equal(card.querySelector("svg").getAttribute("width"), "64");
  items[20] = { ...items[20], is_owned: false, release_date: "2002-03-04" };
  refreshKey++;
  await render();
  assert.equal(option("Mini pages").getAttribute("aria-checked"), "true");
  assert.match(collection().querySelector("button").textContent, /Not owned/);
  assert.match(collection().querySelector("button").textContent, /2002-03-04/);
  assert.equal(button("Next").disabled, true);
});

test("mini pages show descriptions at the bottom, omit blank ones, and refresh their text", async () => {
  items[0].description = "A long description. ".repeat(100);
  items[1].description = "   ";
  await render();
  assert.equal(collection().querySelector(".summaryDescription"), null);
  await click(option("Mini pages"));
  const cards = collection().querySelectorAll("li > button");
  assert.equal(cards[0].lastElementChild.className, "summaryDescription");
  assert.equal(cards[0].lastElementChild.textContent, items[0].description.trim());
  assert.equal(cards[1].querySelector(".summaryDescription"), null);
  items[0].description = "Updated description";
  refreshKey++;
  await render();
  assert.equal(collection().querySelector(".summaryDescription").textContent, "Updated description");
  for (const view of ["List", "Icons", "Table"]) {
    await click(option(view));
    assert.equal(collection().querySelector(".summaryDescription"), null);
  }
});
