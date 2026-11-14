import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "HTMLElement", "HTMLInputElement", "Event", "KeyboardEvent"]) {
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
    const filtered = items.filter((item) => (!params.has("item_type") || item.item_type === params.get("item_type"))
      && item.title.toLowerCase().includes((params.get("q") ?? "").toLowerCase())
      && (!params.has("is_owned") || Boolean(item.is_owned) === (params.get("is_owned") === "true"))
      && ["release_date", "date_added"].every((field) =>
        (!params.has(`${field}_from`) || item[field] && item[field] >= params.get(`${field}_from`))
        && (!params.has(`${field}_to`) || item[field] && item[field] <= params.get(`${field}_to`))));
    return Response.json({ items: filtered.slice(offset, offset + limit), total: filtered.length, offset, limit });
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
  }, onOpenItem: () => {} });
}
const render = () => act(async () => root.render(manager()));
const button = (title) => [...container.querySelectorAll("button")].find((node) => (node.getAttribute("aria-label") ?? node.textContent.trim()) === title);
const option = (title) => [...container.querySelectorAll('[role="menuitemradio"]')].find((node) => node.textContent.replace("✓", "").trim() === title);
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const doubleClick = (node) => act(async () => {
  assert.ok(node);
  node.click();
  node.click();
  node.dispatchEvent(new dom.window.MouseEvent("dblclick", { bubbles: true, detail: 2 }));
});
const collection = () => container.querySelector('[aria-label="Collection items"]');
const searchInput = () => container.querySelector('input[type="search"]');
const typeSearch = (value) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(searchInput(), value);
  searchInput().dispatchEvent(new Event("input", { bubbles: true }));
});
const submitSearch = () => act(async () => {
  container.querySelector('[role="search"]').dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
});

const filterDialog = () => container.querySelector('[role="dialog"]');
const filterField = (label) => [...filterDialog().querySelectorAll("select, input")].find((node) =>
  (node.getAttribute("aria-label") ?? node.labels[0]?.firstChild.textContent.trim()) === label);
const changeFilter = (label, value) => act(async () => {
  const node = filterField(label);
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "value").set.call(node, value);
  node.dispatchEvent(new Event(node.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
});

test("filter dialog drafts can be cancelled with focus restored and keyboard focus contained", async () => {
  await render();
  button("Filter").focus();
  await click(button("Filter"));
  assert.equal(filterDialog().getAttribute("aria-modal"), "true");
  assert.equal(button("Filter").getAttribute("aria-controls"), filterDialog().id);
  assert.equal(document.activeElement, filterField("Category"));
  const count = calls.length;
  await changeFilter("Category", "game");
  await changeFilter("Ownership", "false");
  assert.equal(calls.length, count);
  button("Cancel").focus();
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })));
  assert.equal(document.activeElement, button("Close filters"));
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })));
  assert.equal(document.activeElement, button("Cancel"));
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
  assert.equal(filterDialog(), null);
  assert.equal(document.activeElement, button("Filter"));
  assert.equal(calls.length, count);
  await click(button("Filter"));
  assert.equal(filterField("Category").value, "");
  assert.equal(filterField("Ownership").value, "");
  await click(button("Close filters"));
  assert.equal(filterDialog(), null);
});

test("filters combine category, ownership and dates with search, pagination, refresh and reset", async () => {
  const [book, game] = items;
  items = Array.from({ length: 23 }, (_, index) => [
    { ...book, id: index * 2 + 1, title: `Match ${index + 1}` },
    { ...game, id: index * 2 + 2, title: `Match game ${index + 1}` },
  ]).flat();
  const query = () => new URL(calls.at(-1)).searchParams;
  await render();
  assert.equal(button("Reset filters"), undefined);
  await click(button("Match 1"));
  await click(button("Search"));
  await typeSearch("Match");
  await submitSearch();
  await click(button("Next"));
  await click(button("Filter"));
  for (const [label, value] of [
    ["Category", "book"], ["Ownership", "true"],
    ["Release date from", "2001-02-03"], ["Release date to", "2001-02-03"],
    ["Date added from", "2026-11-12"], ["Date added to", "2026-11-12"],
  ]) await changeFilter(label, value);
  await click(button("Apply"));
  assert.equal(filterDialog(), null);
  assert.equal(query().get("offset"), "0");
  assert.equal(query().get("item_type"), "book");
  assert.equal(query().get("is_owned"), "true");
  assert.equal(query().get("release_date_from"), "2001-02-03");
  assert.equal(query().get("release_date_to"), "2001-02-03");
  assert.equal(query().get("date_added_from"), "2026-11-12");
  assert.equal(query().get("date_added_to"), "2026-11-12");
  assert.equal(query().get("q"), "Match");
  assert.match(container.textContent, /1–20 of 23/);
  assert.equal(button("Match 1").getAttribute("aria-current"), "true");
  assert.equal(button("Filter").getAttribute("aria-pressed"), "true");
  await click(button("Next"));
  assert.equal(query().get("offset"), "20");
  assert.equal(collection().querySelectorAll("tbody tr").length, 3);
  await click(option("Descending"));
  await click(option("List"));
  refreshKey++;
  await render();
  assert.equal(query().get("is_owned"), "true");
  assert.equal(query().get("sort_direction"), "desc");
  await click(button("Filter"));
  assert.equal(filterField("Category").value, "book");
  assert.equal(filterField("Release date to").value, "2001-02-03");
  await changeFilter("Ownership", "false");
  await click(button("Cancel"));
  assert.equal(query().get("is_owned"), "true");
  assert.match(button("Reset filters").nextElementSibling.textContent, /^Filters: /);
  assert.equal(button("Reset filters").closest('[role="toolbar"]'), null);
  await click(button("Reset filters"));
  assert.equal(filterDialog(), null);
  assert.equal(query().has("item_type"), false);
  assert.equal(query().has("is_owned"), false);
  assert.equal(query().has("release_date_from"), false);
  assert.equal(query().has("date_added_to"), false);
  assert.equal(query().get("q"), "Match");
  assert.equal(query().get("sort_direction"), "desc");
  assert.equal(button("Filter").getAttribute("aria-pressed"), "false");
  assert.equal(button("Reset filters"), undefined);
  assert.equal(container.querySelector(".filterSummary"), null);
  assert.match(container.textContent, /1–20 of 46/);
  assert.equal(option("List").getAttribute("aria-checked"), "true");
});

test("filters use the current category and show empty results and invalid date ranges", async () => {
  await render();
  await click(option("Categories"));
  await doubleClick(button("Book"));
  await click(button("Filter"));
  assert.equal(filterField("Category").value, "book");
  await changeFilter("Ownership", "false");
  await click(button("Apply"));
  assert.match(container.textContent, /No items match the selected filters/);
  assert.match(container.textContent, /0 items/);
  await click(button("Filter"));
  const count = calls.length;
  for (const field of ["Release date", "Date added"]) {
    await changeFilter(`${field} from`, "2026-11-02");
    await changeFilter(`${field} to`, "2026-11-01");
    assert.equal(button("Apply").disabled, true);
    assert.equal(filterField(`${field} to`).getAttribute("aria-invalid"), "true");
    assert.match(filterDialog().querySelector('[role="alert"]').textContent, /end date must be on or after start date/);
    await click(button("Apply"));
    assert.equal(calls.length, count);
    await changeFilter(`${field} from`, "");
    await changeFilter(`${field} to`, "");
  }
  assert.equal(button("Apply").disabled, false);
  await changeFilter("Category", "");
  await click(button("Apply"));
  assert.equal(new URL(calls.at(-1)).searchParams.get("is_owned"), "false");
  assert.ok(button("Second item"));
});

test("applying filters from the category overview opens item results", async () => {
  await render();
  await click(option("Categories"));
  await click(button("Filter"));
  await changeFilter("Category", "book");
  await click(button("Apply"));
  assert.equal(container.querySelector('[aria-label="Collection categories"]'), null);
  assert.ok(button("First item"));
  assert.equal(button("Second item"), undefined);
});

test("search submits on the form, resets pagination, retains selection and can be cleared", async () => {
  items = Array.from({ length: 23 }, (_, index) => ({ ...items[0], id: index + 1, title: `Item ${index + 1}` }));
  const query = () => new URL(calls.at(-1)).searchParams;
  await render();
  assert.equal(searchInput(), null);
  assert.equal(button("Search").getAttribute("aria-expanded"), "false");
  await click(button("Item 1"));
  await click(button("Next"));
  assert.equal(query().get("offset"), "20");
  await click(button("Search"));
  assert.equal(button("Search").getAttribute("aria-expanded"), "true");
  assert.equal(button("Search").getAttribute("aria-controls"), container.querySelector('[role="search"]').id);
  assert.equal(document.activeElement, searchInput());
  const requestCount = calls.length;
  await typeSearch("  Item 1  ");
  assert.equal(calls.length, requestCount);
  await submitSearch();
  assert.equal(query().get("q"), "Item 1");
  assert.equal(query().get("offset"), "0");
  assert.match(container.textContent, /1–11 of 11/);
  assert.equal(button("Item 1").getAttribute("aria-current"), "true");
  assert.equal(button("Item 2"), undefined);
  assert.equal(button("Next").disabled, true);
  await typeSearch("Unsubmitted draft");
  const searchedRequestCount = calls.length;
  await click(button("Search"));
  assert.equal(searchInput(), null);
  assert.equal(button("Search").getAttribute("aria-expanded"), "false");
  assert.equal(calls.length, searchedRequestCount);
  assert.match(container.textContent, /Results for “Item 1”/);
  assert.equal(button("Item 2"), undefined);
  await click(button("Search"));
  assert.equal(searchInput().value, "Unsubmitted draft");
  assert.equal(document.activeElement, searchInput());
  assert.equal(calls.length, searchedRequestCount);
  await click(button("Clear search"));
  assert.equal(searchInput().value, "");
  assert.equal(document.activeElement, searchInput());
  assert.equal(query().has("q"), false);
  assert.ok(button("Item 2"));
  assert.equal(button("Clear search").disabled, true);
});

test("search works with category pagination, ordering, views, refresh and retry", async () => {
  const [book, game] = items;
  items = Array.from({ length: 23 }, (_, index) => [
    { ...book, id: index * 2 + 1, title: `Match book ${index + 1}` },
    { ...game, id: index * 2 + 2, title: `Match game ${index + 1}` },
  ]).flat();
  items.push({ ...book, id: 100, title: "Unrelated book" });
  const query = () => new URL(calls.at(-1)).searchParams;
  await render();
  await click(option("Categories"));
  await doubleClick(button("Book"));
  await click(button("Search"));
  await typeSearch("Match");
  await click(button("Find"));
  assert.equal(query().get("item_type"), "book");
  assert.equal(query().get("q"), "Match");
  assert.equal(button("Unrelated book"), undefined);
  await click(button("Next"));
  assert.equal(query().get("offset"), "20");
  assert.equal(query().get("q"), "Match");
  assert.match(container.textContent, /21–23 of 23/);
  await click(option("Descending"));
  assert.equal(query().get("offset"), "0");
  assert.equal(query().get("sort_direction"), "desc");
  await click(option("Icons"));
  assert.equal(collection().tagName, "UL");
  failLoad = true;
  refreshKey++;
  await render();
  assert.match(container.querySelector('[role="alert"]').textContent, /Cannot load collection/);
  failLoad = false;
  await click(button("Retry"));
  assert.equal(query().get("q"), "Match");
  assert.equal(query().get("item_type"), "book");
  assert.equal(query().get("sort_direction"), "desc");
  assert.equal(option("Icons").getAttribute("aria-checked"), "true");
  await click(button("Clear search"));
  assert.equal(query().has("q"), false);
  assert.equal(query().get("item_type"), "book");
});

test("searching from category folders opens results and empty searches offer a clear action", async () => {
  await render();
  await click(option("Categories"));
  await click(button("Search"));
  await typeSearch("Missing");
  await submitSearch();
  assert.equal(container.querySelector('[aria-label="Collection categories"]'), null);
  assert.equal(new URL(calls.at(-1)).searchParams.has("item_type"), false);
  assert.match(container.textContent, /No items match “Missing”/);
  assert.match(container.textContent, /0 items/);
  assert.equal(button("Next").disabled, true);
  await click(button("Clear search"));
  assert.ok(button("First item"));
  await typeSearch("   ");
  await submitSearch();
  assert.equal(new URL(calls.at(-1)).searchParams.has("q"), false);
  assert.ok(button("Second item"));
});

test("a late search response cannot replace newer results", async () => {
  await render();
  await click(button("Search"));
  const pending = [];
  globalThis.fetch = (url, options) => new Promise((resolve) => pending.push({ url, options, resolve }));
  await typeSearch("First");
  await submitSearch();
  await typeSearch("Second");
  await submitSearch();
  assert.equal(pending.length, 2);
  assert.equal(pending[0].options.signal.aborted, true);
  await act(async () => pending[1].resolve(Response.json({ items: [items[1]], total: 1, offset: 0, limit: 20 })));
  await act(async () => pending[0].resolve(Response.json({ items: [items[0]], total: 1, offset: 0, limit: 20 })));
  assert.ok(button("Second item"));
  assert.equal(button("First item"), undefined);
});

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

test("ordering resets pagination, supports keyboard activation, and survives view changes and refresh", async () => {
  items = Array.from({ length: 23 }, (_, index) => ({ ...items[0], id: index + 1, title: `Item ${index + 1}` }));
  const query = () => new URL(calls.at(-1)).searchParams;
  await render();
  assert.equal(option("Title").getAttribute("aria-checked"), "true");
  assert.equal(option("Ascending").getAttribute("aria-checked"), "true");
  assert.equal(query().get("sort_by"), "title");
  assert.equal(query().get("sort_direction"), "asc");
  await click(button("Item 1"));
  await click(option("List"));
  await click(button("Next"));
  assert.equal(query().get("offset"), "20");

  await click(option("Release date"));
  assert.equal(query().get("offset"), "0");
  assert.equal(query().get("sort_by"), "release_date");
  assert.equal(option("Release date").getAttribute("aria-checked"), "true");
  assert.equal(option("Title").getAttribute("aria-checked"), "false");
  assert.equal(button("Item 1").getAttribute("aria-current"), "true");
  assert.equal(option("List").getAttribute("aria-checked"), "true");

  await act(async () => option("Descending").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
  assert.equal(query().get("sort_direction"), "desc");
  assert.equal(option("Descending").getAttribute("aria-checked"), "true");
  assert.equal(option("Ascending").getAttribute("aria-checked"), "false");
  await click(button("Next"));
  assert.equal(query().get("sort_direction"), "desc");
  await act(async () => option("Date added").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true })));
  assert.equal(query().get("sort_by"), "date_added");
  assert.equal(query().get("offset"), "0");

  const requestCount = calls.length;
  await click(option("Date added"));
  await click(option("Icons"));
  assert.equal(calls.length, requestCount);
  refreshKey++;
  await render();
  assert.equal(query().get("sort_by"), "date_added");
  assert.equal(query().get("sort_direction"), "desc");
  assert.equal(option("Date added").getAttribute("aria-checked"), "true");
  assert.equal(option("Descending").getAttribute("aria-checked"), "true");
});

test("categories select on click, open on double-click or Enter, and retain item selection and layouts", async () => {
  await render();
  await click(button("First item"));
  await click(option("List"));
  const requestCount = calls.length;
  await act(async () => option("Categories").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
  assert.equal(calls.length, requestCount);
  assert.equal(option("Categories").getAttribute("aria-checked"), "true");
  assert.equal(option("List").getAttribute("aria-checked"), "false");
  const folders = container.querySelector('[aria-label="Collection categories"]');
  assert.deepEqual([...folders.querySelectorAll("button")].map((node) => node.textContent), [
    "Board game", "Book", "Figurine", "Film", "Journal issue", "LEGO set", "Miniature", "Video game",
  ]);
  assert.equal(folders.querySelectorAll("svg").length, 8);
  assert.equal(collection(), null);
  assert.equal(button("Next"), undefined);
  assert.match(container.textContent, /8 categories/);

  await click(button("Book"));
  assert.equal(button("Book").getAttribute("aria-pressed"), "true");
  assert.equal(collection(), null);
  assert.equal(calls.length, requestCount);
  await click(button("Video game"));
  assert.equal(button("Video game").getAttribute("aria-pressed"), "true");
  assert.equal(button("Book").getAttribute("aria-pressed"), "false");
  assert.equal(calls.length, requestCount);
  await doubleClick(button("Book"));
  assert.equal(new URL(calls.at(-1)).searchParams.get("item_type"), "book");
  assert.equal(collection().querySelectorAll("li").length, 1);
  assert.equal(button("First item").getAttribute("aria-current"), "true");
  assert.equal(button("Second item"), undefined);
  assert.equal(container.querySelector('nav [aria-current="page"]').textContent, "Book");
  assert.equal(option("List").getAttribute("aria-checked"), "true");
  await click(option("Mini pages"));
  assert.match(collection().textContent, /Book · Owned/);

  await click(button("Categories"));
  await act(async () => button("Video game").dispatchEvent(new KeyboardEvent("keydown", {
    key: "Enter", bubbles: true, cancelable: true,
  })));
  assert.equal(new URL(calls.at(-1)).searchParams.get("item_type"), "game");
  assert.equal(button("First item"), undefined);
  assert.match(collection().textContent, /Second item/);
  assert.equal(option("Mini pages").getAttribute("aria-checked"), "true");
  await click(collection().querySelector("button"));
  assert.equal(selectedItemId, 2);
  await click(button("All items"));
  assert.equal(new URL(calls.at(-1)).searchParams.has("item_type"), false);
  assert.equal(collection().querySelectorAll("li").length, 2);
  assert.equal(container.querySelector('[aria-label="Collection folders"]'), null);
  assert.equal(collection().querySelectorAll("button")[1].getAttribute("aria-current"), "true");
});

test("category pagination, ordering, refresh and retries keep the selected subtype", async () => {
  const [book, game] = items;
  items = Array.from({ length: 23 }, (_, index) => [
    { ...game, id: index * 2 + 1, title: `Game ${index + 1}` },
    { ...book, id: index * 2 + 2, title: `Book ${index + 1}` },
  ]).flat();
  const query = () => new URL(calls.at(-1)).searchParams;
  await render();
  await click(button("Next"));
  await click(option("Categories"));
  await doubleClick(button("Book"));
  assert.equal(query().get("offset"), "0");
  assert.equal(query().get("item_type"), "book");
  assert.equal(collection().querySelectorAll("tbody tr").length, 20);
  assert.equal(button("Game 1"), undefined);
  assert.match(container.textContent, /1–20 of 23/);
  await click(button("Next"));
  assert.equal(query().get("item_type"), "book");
  assert.equal(query().get("offset"), "20");
  assert.equal(collection().querySelectorAll("tbody tr").length, 3);
  assert.ok(button("Book 21"));
  assert.match(container.textContent, /21–23 of 23/);
  await click(option("Descending"));
  assert.equal(query().get("offset"), "0");
  assert.equal(query().get("sort_direction"), "desc");
  assert.equal(query().get("item_type"), "book");

  failLoad = true;
  refreshKey++;
  await render();
  assert.match(container.querySelector('[role="alert"]').textContent, /Cannot load collection/);
  failLoad = false;
  await click(button("Retry"));
  assert.equal(query().get("item_type"), "book");
  assert.equal(query().get("sort_direction"), "desc");
  assert.ok(button("Book 1"));
  await click(button("Next"));
  items = items.filter((item) => item.item_type !== "book" || item.id <= 40);
  refreshKey++;
  await render();
  assert.equal(query().get("offset"), "0");
  assert.equal(query().get("item_type"), "book");
  assert.match(container.textContent, /1–20 of 20/);
});

test("empty category folders can return to categories or switch to all items", async () => {
  await render();
  await click(option("Categories"));
  await doubleClick(button("Film"));
  assert.match(container.textContent, /No items in this category yet/);
  assert.match(container.textContent, /0 items/);
  assert.equal(button("Next").disabled, true);
  await click(button("Categories"));
  await click(option("Icons"));
  assert.equal(new URL(calls.at(-1)).searchParams.has("item_type"), false);
  assert.equal(option("Icons").getAttribute("aria-checked"), "true");
  assert.ok(button("First item"));
  assert.ok(button("Second item"));
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
