import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { existingItem } from "./fixtures/item.mjs";

const dom = new JSDOM("<body></body>", { url: "http://localhost" });
for (const key of ["window", "document", "HTMLElement", "Event"]) globalThis[key] = dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { CopyEditor } = await import("../src/pages/CopyEditor/CopyEditor.tsx");
const { CollectionView } = await import("../src/pages/CollectionView/CollectionView.tsx");
const { NavBar } = await import("../src/components/NavBar/NavBar.tsx");
const { itemService, referenceService } = await import("../src/services/index.ts");
const good = { id: 4, name: "Good" };
const likeNew = { id: 2, name: "Like New" };
const first = { id: 17, notes: "Gift", condition: { condition_type: good, notes: "Worn box" }, photos: [] };
const second = { id: 21, notes: "Spare", condition: { condition_type: likeNew, notes: null }, photos: [] };
const otherItem = { ...existingItem, id: 43, display_title: "Another game", owned_copies: [] };
let root, container, item;

beforeEach((t) => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  item = { ...existingItem, is_owned: false, owned_copies: [] };
  t.mock.method(itemService, "get", async (id) => {
    if (id === otherItem.id) return structuredClone(otherItem);
    if (id !== item.id) throw new Error("Item not found");
    return structuredClone(item);
  });
  t.mock.method(itemService, "list", async () => ({
    items: [item, otherItem].map((record) => ({ id: record.id, title: record.display_title })),
    total: 2, offset: 0, limit: 20,
  }));
  t.mock.method(referenceService, "conditionTypes", async () => [good, likeNew]);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

function HistoryBack() {
  const navigate = useNavigate();
  return h("button", { onClick: () => navigate(-1) }, "History back");
}

const render = (copies, path = "/copy-editor?itemId=42", history = false) => {
  item.owned_copies = copies;
  return act(async () => root.render(h(MemoryRouter, { initialEntries: [path] },
    h(NavBar), history && h(HistoryBack), h(Routes, null,
      h(Route, { path: "/copy-editor", element: h(CopyEditor) }),
      h(Route, { path: "/collection-view", element: h(CollectionView) })))));
};
const button = (name, scope = container) => [...scope.querySelectorAll("button")].find((node) => node.textContent === name);
const click = (name, scope) => act(async () => { const node = button(name, scope); assert.ok(node, name); node.click(); });
const dialog = () => container.querySelector('[role="alertdialog"]');
const article = (id) => container.querySelector(`article[aria-label="Copy #${id}"]`);
const field = (name) => [...container.querySelectorAll("label")].find((label) => label.firstChild.textContent === name).control;
async function change(name, value) {
  const node = field(name);
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "value").set;
  await act(async () => {
    setter.call(node, value);
    node.dispatchEvent(new Event(node.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
}

test("a failed save keeps both notes, the grade and the submission ID until the new copy is saved", async (t) => {
  const drafts = [];
  t.mock.method(itemService, "addCopy", async (id, data) => {
    assert.equal(id, existingItem.id);
    drafts.push(data);
    if (drafts.length === 1) throw new Error("Response interrupted");
    return { ...existingItem, is_owned: false, owned_copies: [first] };
  });
  await render([]);
  await click("Add copy");
  await change("Condition grade", "4");
  await change("Condition notes", "Worn box");
  await change("Copy notes", "Gift");
  await click("Save copy");
  assert.match(container.querySelector('[role="alert"]').textContent, /Response interrupted/);
  assert.deepEqual(["Condition grade", "Condition notes", "Copy notes"].map((name) => field(name).value), ["4", "Worn box", "Gift"]);
  await click("Save copy");
  assert.ok(drafts[0].request_id);
  assert.deepEqual(drafts[1], drafts[0]);
  assert.match(article(17).textContent, /Worn box/);
  assert.match(container.textContent, /Owned through 1 recorded copy/);
  await click("Add copy");
  await click("Save copy");
  assert.notEqual(drafts[2].request_id, drafts[0].request_id);
});

test("editing and removal address the chosen copy, and cancelling either action preserves both", async (t) => {
  const updated = { ...second, notes: "Shelf 2" };
  const put = t.mock.method(itemService, "updateCopy", async (itemId, copyId, data) => {
    assert.deepEqual([itemId, copyId, data], [42, second.id, { condition_type_id: 2, notes: "Shelf 2", condition_notes: null }]);
    return { ...existingItem, owned_copies: [first, updated] };
  });
  const remove = t.mock.method(itemService, "removeCopy", async (itemId, copyId) => {
    assert.deepEqual([itemId, copyId], [42, second.id]);
    return { ...existingItem, owned_copies: [first] };
  });
  await render([first, second]);
  await click("Edit copy", article(21));
  await change("Copy notes", "Unsaved");
  await click("Cancel");
  assert.equal(put.mock.callCount(), 0);
  assert.match(article(21).textContent, /Spare/);
  await click("Edit copy", article(21));
  await change("Copy notes", "Shelf 2");
  await click("Save copy");
  assert.match(article(21).textContent, /Shelf 2/);
  await click("Remove copy", article(21));
  assert.match(dialog().textContent, /#21 \(Like New\)/);
  await click("Cancel", dialog());
  assert.equal(remove.mock.callCount(), 0);
  assert.ok(article(21));
  await click("Remove copy", article(21));
  await click("Remove copy", dialog());
  assert.equal(article(21), null);
  assert.match(article(17).textContent, /Worn box/);
});

test("Collection submenu shows both panes and returns a saved copy to its read-only Explorer page", async (t) => {
  const save = t.mock.method(itemService, "addCopy", async (id) => {
    assert.equal(id, item.id);
    item = { ...item, owned_copies: [first] };
    return structuredClone(item);
  });
  await render([], "/collection-view?itemId=42");
  const readOnly = () => container.querySelector('section[aria-label="Owned copies"]');
  assert.match(readOnly().textContent, /No copies recorded/);
  assert.equal(readOnly().querySelector("button, input, select, textarea"), null);
  const nav = [...container.querySelectorAll("nav li")].find((entry) => entry.textContent === "Copy Editor");
  await act(async () => nav.click());
  assert.match(container.textContent, /Open an item in Collection Manager/);
  assert.equal(button("Open copies").disabled, true);
  await click(item.display_title);
  await click("Open copies");
  assert.ok(button(otherItem.display_title));
  await click("Add copy");
  await click("Save copy");
  assert.equal(save.mock.callCount(), 1);
  await click("View in Explorer");
  assert.equal(container.querySelector("h1").textContent, item.display_title);
  assert.match(readOnly().textContent, /Good.*Worn box.*Gift/);
  assert.equal(readOnly().querySelector("button, input, select, textarea"), null);
});

test("Collection Manager stays available when the open item cannot load", async () => {
  await render([], "/copy-editor?itemId=999");
  assert.match(container.querySelector('[role="alert"]').textContent, /Item not found/);
  await click(item.display_title);
  await click("Open copies");
  assert.ok(button("Add copy"));
});

test("row selection and reopening the current item keep a draft; switching asks before discarding it", async (t) => {
  const write = t.mock.method(itemService, "updateCopy");
  await render([first]);
  await click("Edit copy", article(first.id));
  await change("Condition notes", "Split case");
  await change("Copy notes", "A gift");
  await change("Condition grade", "2");
  await click(item.display_title);
  await click("Open copies");
  assert.equal(dialog(), null);
  await click(otherItem.display_title);
  assert.equal(dialog(), null);
  await act(async () => button(otherItem.display_title).dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  assert.equal(document.activeElement, button("Keep editing", dialog()));
  await click("Keep editing", dialog());
  assert.equal(button(item.display_title).getAttribute("aria-current"), "true");
  assert.deepEqual(["Condition notes", "Copy notes", "Condition grade"].map((name) => field(name).value), ["Split case", "A gift", "2"]);
  await act(async () => button(otherItem.display_title).dispatchEvent(new window.MouseEvent("dblclick", { bubbles: true })));
  await click("Discard changes", dialog());
  assert.equal(container.querySelector("h1").textContent, otherItem.display_title);
  await click(item.display_title);
  await click("Open copies");
  assert.match(article(first.id).textContent, /Worn box/);
  assert.equal(write.mock.callCount(), 0);
});

test("reverting edits or leaving an untouched new form opens the next item directly", async () => {
  await render([first]);
  await click("Edit copy", article(first.id));
  await change("Copy notes", "Different");
  await change("Copy notes", first.notes);
  await click(otherItem.display_title);
  await click("Open copies");
  assert.equal(container.querySelector("h1").textContent, otherItem.display_title);
  await click("Add copy");
  await click(item.display_title);
  await click("Open copies");
  assert.equal(dialog(), null);
  assert.ok(article(first.id));
});

test("a pending save holds the current item and a failed save still protects the draft", async (t) => {
  let reject;
  const save = t.mock.method(itemService, "addCopy", () => new Promise((_, fail) => { reject = fail; }));
  await render([]);
  await click("Add copy");
  await change("Copy notes", "Boxed");
  await click("Save copy");
  await act(async () => button(otherItem.display_title).dispatchEvent(new window.MouseEvent("dblclick", { bubbles: true })));
  assert.equal(container.querySelector("h1").textContent, item.display_title);
  assert.equal(dialog(), null);
  await act(async () => reject(new Error("Save failed")));
  await click(otherItem.display_title);
  await click("Open copies");
  await click("Keep editing", dialog());
  assert.equal(field("Copy notes").value, "Boxed");
  save.mock.mockImplementation(async () => ({ ...item, owned_copies: [first] }));
  const previousLoads = itemService.list.mock.callCount();
  await click("Save copy");
  assert.ok(itemService.list.mock.callCount() > previousLoads);
  await click(otherItem.display_title);
  await click("Open copies");
  assert.equal(container.querySelector("h1").textContent, otherItem.display_title);
  assert.equal(dialog(), null);
});

test("history navigation between editor items also preserves a dirty draft until confirmed", async () => {
  await render([], "/copy-editor?itemId=42", true);
  await click(otherItem.display_title);
  await click("Open copies");
  await click("Add copy");
  await change("Condition notes", "Still editing");
  await click("History back");
  assert.equal(container.querySelector("h1").textContent, otherItem.display_title);
  await click("Keep editing", dialog());
  assert.equal(field("Condition notes").value, "Still editing");
  assert.equal(dialog(), null);
});
