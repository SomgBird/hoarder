import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { existingItem } from "./fixtures/item.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost", pretendToBeVisual: true });
for (const key of ["window", "document", "HTMLElement", "HTMLInputElement", "Event", "MouseEvent", "FileReader", "File", "Blob", "FormData"]) {
  globalThis[key] = key === "window" ? dom.window : dom.window[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { ReferencePicker } = await import("../src/pages/PageEditor/PageEditorWorkspace/ReferencePicker.tsx");
const { ReferenceContext, useReferenceData } = await import("../src/pages/PageEditor/PageEditorWorkspace/referenceData.ts");
const { PageEditorWorkspace } = await import("../src/pages/PageEditor/PageEditorWorkspace/PageEditorWorkspace.tsx");
const { ImageUpload } = await import("../src/pages/PageEditor/PageEditorWorkspace/ImageUpload.tsx");
const { PageEditor } = await import("../src/pages/PageEditor/PageEditor.tsx");
const { CollectionView } = await import("../src/pages/CollectionView/CollectionView.tsx");

let root;
let container;
let calls;
let savedPayload;
let failCreate;
let storedItem;
let failLoad;
let failUpdate;
const originalFetch = globalThis.fetch;
beforeEach(() => {
  calls = [];
  savedPayload = null;
  failCreate = false;
  failLoad = false;
  failUpdate = false;
  storedItem = structuredClone(existingItem);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    calls.push({ path: parsed.pathname, method: options.method ?? "GET", body: options.body });
    if (parsed.pathname === "/items/itemlist") return Response.json({
      items: [{ id: 42, title: storedItem.display_title, release_date: storedItem.release_date }], total: 1, offset: 0, limit: 20,
    });
    if (parsed.pathname === "/items/42") {
      if (options.method === "PATCH") {
        if (failUpdate) return Response.json({ detail: "Update failed" }, { status: 500 });
        savedPayload = JSON.parse(options.body);
        storedItem = { ...storedItem, display_title: savedPayload.titles[0].title_text, description: savedPayload.description, details: savedPayload.details };
      } else if (failLoad) return Response.json({ detail: "Item not found" }, { status: 404 });
      return Response.json(storedItem);
    }
    if (parsed.pathname === "/items/") {
      savedPayload = JSON.parse(options.body);
      return Response.json({ id: 42, ...savedPayload });
    }
    if (options.method === "POST") {
      if (failCreate) return Response.json({ detail: "Could not create entry" }, { status: 400 });
      return Response.json({ id: 9, name: JSON.parse(options.body).name });
    }
    const resource = parsed.pathname.split("/").at(-1);
    const lists = {
      languages: [{ id: 1, code: "en", name: "English" }, { id: 2, code: "ru", name: "Russian" }],
      franchises: [{ id: 7, name: "Existing franchise" }],
      formats: parsed.searchParams.get("item_type") === "book" ? [{ id: 3, name: "Hardcover" }] : [{ id: 4, name: "Cartridge" }],
      genres: [{ id: 5, name: "Fantasy" }],
      tags: [{ id: 8, name: "One, two" }],
      "barcode-types": [{ id: 10, name: "EAN" }],
      "author-roles": [{ id: 12, name: "Writer" }],
      "company-roles": [{ id: 14, name: "Publisher" }],
    };
    return Response.json(lists[resource] ?? []);
  };
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  globalThis.fetch = originalFetch;
});

function Harness({ resource, multiple = false }) {
  const data = useReferenceData("book");
  const [value, setValue] = useState(multiple ? [] : "");
  return createElement(ReferenceContext.Provider, { value: data },
    createElement(ReferencePicker, { resource, label: resource, multiple, value, onChange: setValue }),
    createElement("output", null, JSON.stringify(value)));
}
const render = (component) => act(async () => { root.render(component); });
const button = (label, scope = container) => [...scope.querySelectorAll("button")].find((node) => node.textContent.trim() === label);
const click = (node) => act(async () => { assert.ok(node); node.click(); });
const choose = (node, value) => act(async () => {
  assert.ok(node);
  node.value = value;
  node.dispatchEvent(new Event("change", { bubbles: true }));
});
const type = (node, value) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, value);
  node.dispatchEvent(new Event("input", { bubbles: true }));
});
const section = (title) => [...container.querySelectorAll("section")].find((node) => node.querySelector("h2")?.textContent === title);

test("franchises can be selected, created by name, and removed without manual IDs", async () => {
  await render(createElement(Harness, { resource: "franchises", multiple: true }));
  await choose(container.querySelector("select"), "7");
  assert.equal(container.querySelector("output").textContent, '["7"]');
  await click(button("+ Add new"));
  await type(container.querySelector('[aria-label="New franchises"]'), "New franchise");
  await click(button("Add and select"));
  assert.equal(container.querySelector("output").textContent, '["7","9"]');
  assert.match(container.querySelector("ul").textContent, /New franchise/);
  assert.deepEqual(JSON.parse(calls.find((call) => call.method === "POST").body), { name: "New franchise" });
  await click(container.querySelector('[aria-label="Remove Existing franchise"]'));
  assert.equal(container.querySelector("output").textContent, '["9"]');
});

test("failed reference creation keeps the name and allows a retry", async () => {
  await render(createElement(Harness, { resource: "franchises" }));
  await click(button("+ Add new"));
  await type(container.querySelector('[aria-label="New franchises"]'), "Retry franchise");
  failCreate = true;
  await click(button("Add and select"));
  assert.match(container.querySelector('[role="alert"]').textContent, /Could not create entry/);
  assert.equal(container.querySelector('[aria-label="New franchises"]').value, "Retry franchise");
  failCreate = false;
  await click(button("Add and select"));
  assert.equal(container.querySelector("output").textContent, '"9"');
});

test("languages offer only predefined choices and typing a search never adds a language", async () => {
  await render(createElement(Harness, { resource: "languages" }));
  assert.equal(button("+ Add new"), undefined);
  await type(container.querySelector('input[type="search"]'), "russ");
  assert.deepEqual([...container.querySelectorAll("option")].map((node) => node.value), ["", "ru"]);
  await choose(container.querySelector("select"), "ru");
  await type(container.querySelector('input[type="search"]'), "Made up language");
  assert.equal(container.querySelector("output").textContent, '"ru"');
  assert.equal(calls.some((call) => call.method === "POST"), false);
});

test("editor clears scoped selections on type change and submits chosen languages", async () => {
  await render(createElement(PageEditorWorkspace, { initialData: { pageType: "item", itemType: "book", title: "Example" }, onClose() {} }));
  assert.equal(container.querySelectorAll('input[type="file"]').length, 2);
  assert.equal(container.querySelectorAll('input[aria-label*="ID"], input[aria-label*="path"], input[aria-label*="code"]').length, 0);
  await choose(container.querySelector('[aria-label="Format"]'), "3");
  await choose(container.querySelector('[aria-label="Genres"]'), "5");
  await choose(container.querySelector('[aria-label="Title language"]'), "ru");
  await click(button("+ Add", section("Alternative titles")));
  await type(section("Alternative titles").querySelector('[aria-label="Title"]'), "Alternative");
  await choose(section("Alternative titles").querySelector('[aria-label="Language"]'), "en");
  await click(button("+ Add", section("Languages")));
  await choose(section("Languages").querySelector('[aria-label="Language"]'), "ru");
  await choose(container.querySelector('[aria-label="Item type"]'), "game");
  assert.equal(container.querySelector('[aria-label="Format"]').value, "");
  assert.equal(container.querySelector('[aria-label="Genres"]').closest("td").querySelector("ul"), null);
  assert.ok(container.querySelector('[aria-label="Game platform"]'));
  await click(button("Create"));
  assert.equal(savedPayload.details.type_name, "game");
  assert.equal(savedPayload.format_id, undefined);
  assert.deepEqual(savedPayload.genre_ids, []);
  assert.equal(savedPayload.titles[0].language_code, "ru");
  assert.equal(savedPayload.titles[1].language_code, "en");
  assert.equal(savedPayload.languages[0].language_code, "ru");
  assert.equal("cover_image_path" in savedPayload, false);
  assert.equal("icon_image_path" in savedPayload, false);
});

test("image controls reject invalid files and clear their selection", async () => {
  function Upload() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    return createElement(ImageUpload, { label: "Icon", file, savedPath: null, error,
      onSelect: (next, message) => { setFile(next); setError(message); } });
  }
  await render(createElement(Upload));
  const input = container.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", { configurable: true, value: [new File(["text"], "file.txt", { type: "text/plain" })] });
  await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
  assert.match(container.querySelector('[role="alert"]').textContent, /JPEG, PNG or WebP/);
  await click(button("Clear selection"));
  assert.equal(container.querySelector('[role="alert"]'), null);
});

const routed = (path) => createElement(MemoryRouter, { initialEntries: [path] },
  createElement(Routes, null,
    createElement(Route, { path: "/collection-view", element: createElement(CollectionView) }),
    createElement(Route, { path: "/page-editor", element: createElement(PageEditor) })));
const editButton = () => [...container.querySelectorAll('[role="toolbar"] button')].find((node) => node.textContent.trim() === "Edit");

test("explorer enables Edit for an item, loads the full form, and displays saved changes", async () => {
  await render(routed("/collection-view"));
  assert.equal(editButton().disabled, true);
  await click(container.querySelector('button[aria-current="false"]'));
  assert.equal(editButton().disabled, false);
  await click(editButton());
  assert.equal(container.querySelector('input[aria-label="Title"]').value, "Original title");
  assert.equal(container.querySelector('input[aria-label="Short title"]').value, "Original");
  assert.equal(container.querySelector('[aria-label="Item type"]').disabled, true);
  assert.equal(container.querySelector('[aria-label="Format"]').value, "3");
  assert.equal(container.querySelector('[aria-label="Display language"]').value, "ru");
  assert.equal(container.querySelector('[aria-label="Page count"]').value, "320");
  assert.equal(container.querySelector('[aria-label="Description"]').value, "Original description");
  assert.equal(section("Alternative titles").querySelector('[aria-label="Title"]').value, "Другой заголовок");
  assert.equal(section("Languages").querySelector('[aria-label="UI"]').checked, true);
  assert.equal(section("Barcodes").querySelector('[aria-label="Code"]').value, "123456");
  assert.match(section("Authors").textContent, /Existing author/);
  assert.match(section("Companies").textContent, /Existing company/);
  assert.match(section("Cover").querySelector("img").src, /cover.png$/);
  assert.match(section("Icon").querySelector("img").src, /icon.png$/);

  await type(container.querySelector('input[aria-label="Title"]'), "Updated title");
  await type(container.querySelector('input[aria-label="Short title"]'), "Updated");
  await type(container.querySelector('[aria-label="Page count"]'), "");
  await choose(container.querySelector('[aria-label="Format"]'), "");
  await click(button("Save"));
  assert.equal(savedPayload.titles[0].title_text, "Updated title");
  assert.equal(savedPayload.titles[0].short_text, "Updated");
  assert.equal(savedPayload.format_id, null);
  assert.equal(savedPayload.details.page_count, null);
  assert.deepEqual(savedPayload.author_credits.map((credit) => credit.author_id), [11]);
  assert.equal(calls.some((call) => call.method === "POST"), false);
  assert.equal(container.querySelector("h1").textContent, "Updated title");
  assert.equal(editButton().disabled, false);
});

test("editor load and save failures retain a working retry and the entered values", async () => {
  failLoad = true;
  await render(routed("/page-editor?itemId=42"));
  assert.match(container.querySelector('[role="alert"]').textContent, /Item not found/);
  assert.equal(button("Save"), undefined);
  failLoad = false;
  await click(button("Retry"));
  await type(container.querySelector('input[aria-label="Title"]'), "Retry title");
  failUpdate = true;
  await click(button("Save"));
  assert.match(container.querySelector('[role="alert"]').textContent, /Update failed/);
  assert.equal(container.querySelector('input[aria-label="Title"]').value, "Retry title");
  assert.equal(button("Save").disabled, false);
  failUpdate = false;
  await click(button("Save"));
  assert.equal(container.querySelector("h1").textContent, "Retry title");
});

test("cancelling an edit returns to the same item without writing", async () => {
  await render(routed("/page-editor?itemId=42"));
  await type(container.querySelector('input[aria-label="Title"]'), "Unsaved title");
  await click(button("Cancel"));
  assert.equal(container.querySelector("h1").textContent, "Original title");
  assert.equal(calls.some((call) => call.method !== "GET"), false);
});
