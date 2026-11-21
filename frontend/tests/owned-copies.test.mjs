import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h, useState } from "react";
import { existingItem } from "./fixtures/item.mjs";

const dom = new JSDOM("<body></body>", { url: "http://localhost" });
for (const key of ["window", "document", "HTMLElement", "Event"]) globalThis[key] = dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { OwnedCopies } = await import("../src/components/Explorer/explorer_pages/ItemPage/OwnedCopies.tsx");
const { itemService, referenceService } = await import("../src/services/index.ts");
const good = { id: 4, name: "Good" };
const likeNew = { id: 2, name: "Like New" };
const first = { id: 17, notes: "Gift", condition: { condition_type: good, notes: "Worn box" }, photos: [] };
const second = { id: 21, notes: "Spare", condition: { condition_type: likeNew, notes: null }, photos: [] };
let root, container;

function Page({ copies }) {
  const [item, setItem] = useState({ ...existingItem, is_owned: false, owned_copies: copies });
  return h(OwnedCopies, { item, onChanged: setItem });
}
beforeEach((t) => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  t.mock.method(referenceService, "conditionTypes", async () => [good, likeNew]);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

const render = (copies) => act(async () => root.render(h(Page, { copies })));
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
