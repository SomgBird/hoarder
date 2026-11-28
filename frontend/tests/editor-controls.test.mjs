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
let failGeneration;
const originalFetch = globalThis.fetch;
beforeEach(() => {
  calls = [];
  savedPayload = null;
  failCreate = false;
  failLoad = false;
  failUpdate = false;
  failGeneration = false;
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
        if (savedPayload.titles) storedItem.display_title = savedPayload.titles[0].title_text;
        if ("description" in savedPayload) storedItem.description = savedPayload.description;
        if (savedPayload.details) Object.assign(storedItem.details, savedPayload.details);
      } else if (failLoad) return Response.json({ detail: "Item not found" }, { status: 404 });
      return Response.json(storedItem);
    }
    if (parsed.pathname === "/items/42/cover") {
      storedItem.cover_image_path = "/media/covers/uploaded.png";
      return Response.json(storedItem);
    }
    if (parsed.pathname === "/items/42/icon/from-cover") {
      if (failGeneration) return Response.json({ detail: "Generation failed" }, { status: 400 });
      storedItem.icon_image_path = "/media/covers/generated.ico";
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
  const prototype = node instanceof dom.window.HTMLTextAreaElement ? dom.window.HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(node, value);
  node.dispatchEvent(new Event("input", { bubbles: true }));
});
const section = (title) => [...container.querySelectorAll("fieldset")].find((node) => node.querySelector(":scope > legend")?.textContent === title);
const tab = (title) => container.querySelector(`[role="tab"][id="editor-tab-${title}"]`);

test("property tabs support arrow keys and keep a reference draft when switching away", async () => {
  await render(createElement(PageEditorWorkspace, { initialData: { pageType: "item", itemType: "book", title: "Example" }, onClose() {} }));
  const panel = () => container.querySelector('[role="tabpanel"]:not([hidden])');
  const press = (key) => act(async () => document.activeElement.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key, bubbles: true })));
  tab("General").focus();
  await press("ArrowRight");
  assert.equal(document.activeElement, tab("Catalog"));
  assert.equal(panel().id, tab("Catalog").getAttribute("aria-controls"));
  const tags = panel().querySelector('[aria-label="Tags"]').closest("td");
  await click(button("+ Add new", tags));
  await type(tags.querySelector('[aria-label="New tags"]'), "Work in progress");
  tab("Catalog").focus();
  await press("End");
  assert.equal(document.activeElement, tab("Images"));
  assert.equal(panel().querySelectorAll('input[type="file"]').length, 2);
  await press("Home");
  assert.equal(document.activeElement, tab("General"));
  await click(tab("Catalog"));
  assert.equal(panel().querySelector('[aria-label="New tags"]').value, "Work in progress");
  assert.equal(container.querySelectorAll('[role="tab"][tabindex="0"]').length, 1);
});

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
  await click(tab("Catalog"));
  await choose(container.querySelector('[aria-label="Format"]'), "3");
  await choose(container.querySelector('[aria-label="Genres"]'), "5");
  await click(tab("General"));
  await choose(container.querySelector('[aria-label="Title language"]'), "ru");
  await click(tab("Languages"));
  await click(button("+ Add", section("Alternative titles")));
  await type(section("Alternative titles").querySelector('[aria-label="Title"]'), "Alternative");
  await choose(section("Alternative titles").querySelector('[aria-label="Language"]'), "en");
  await click(button("+ Add", section("Languages")));
  await choose(section("Languages").querySelector('[aria-label="Language"]'), "ru");
  await click(tab("General"));
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

test("franchise wizard selects an existing franchise and retains an introduction through retry and cancel", async () => {
  const fetchOther = globalThis.fetch;
  const submissions = [];
  const franchise = { id: 7, title: "Existing franchise", introduction: null, members: [] };
  globalThis.fetch = async (url, options = {}) => {
    const { pathname } = new URL(url);
    if (pathname === "/reference/franchises") return Response.json([
      { id: 7, name: franchise.title }, { id: 8, name: "Another franchise" },
    ]);
    if (pathname !== "/franchise-pages/7") return fetchOther(url, options);
    if (options.method === "PUT") {
      const payload = JSON.parse(options.body);
      submissions.push(payload);
      if (submissions.length === 1) throw new Error("Connection lost");
      franchise.introduction = payload.introduction;
    }
    return Response.json(franchise);
  };
  await render(routed("/page-editor"));
  await click([...container.querySelectorAll("label")].find((label) => label.textContent.trim() === "Franchise page"));
  await click(button("Next >"));
  await click(button("Next >"));
  assert.equal(container.querySelector('[role="alert"]').textContent, "Choose a franchise.");
  const search = container.querySelector("#franchise-search");
  const picker = container.querySelector("#franchise-choice");
  const visibleNames = () => [...picker.options].filter((option) => !option.hidden).map((option) => option.text);
  assert.ok(picker.size > 1);
  assert.deepEqual(visibleNames(), ["Another franchise", "Existing franchise"]);
  await type(search, "missing");
  assert.deepEqual(visibleNames(), []);
  assert.equal(container.querySelector('[role="status"]').textContent, "No matching franchises.");
  await type(search, "EXISTING");
  assert.deepEqual(visibleNames(), ["Existing franchise"]);
  await choose(picker, "7");
  await click(button("Next >"));
  await click(button("Finish"));
  const introduction = () => container.querySelector("#franchise-introduction");
  const body = "First paragraph.\n\nSecond paragraph.";
  await type(introduction(), body);
  await click(button("Save franchise page"));
  assert.match(container.querySelector('[role="alert"]').textContent, /Connection lost/);
  assert.equal(introduction().value, body);
  await click(button("Save franchise page"));
  assert.deepEqual(submissions, [{ introduction: body }, { introduction: body }]);
  assert.equal(container.querySelector("article p").textContent, body);
  assert.match(container.querySelector("article").textContent, /No items are assigned/);
  await click(editButton());
  assert.equal(introduction().value, body);
  await type(introduction(), "Discard this draft.");
  await click(button("Cancel"));
  assert.equal(container.querySelector("article p").textContent, body);
  assert.equal(submissions.length, 2);
});

test("Article wizard validates the title, retains a failed draft and opens the saved plain text in Explorer", async () => {
  const fetchOther = globalThis.fetch;
  const submissions = [];
  let article;
  globalThis.fetch = async (url, options) => {
    if (new URL(url).pathname === "/articles/") {
      const payload = JSON.parse(options.body);
      submissions.push(payload);
      if (submissions.length === 1) throw new Error("Connection lost");
      article = { id: 7, title: payload.title, blocks: [{ id: 11, ...payload.blocks[0] }] };
      return Response.json(article);
    }
    if (new URL(url).pathname === "/articles/7") return Response.json(article);
    return fetchOther(url, options);
  };
  await render(routed("/page-editor"));
  await click([...container.querySelectorAll("label")].find((label) => label.textContent.trim() === "Article"));
  await click(button("Next >"));
  assert.equal(container.querySelector("#new-item-type"), null);
  await type(container.querySelector("#new-page-title"), "   ");
  await click(button("Next >"));
  assert.equal(container.querySelector('[role="alert"]').textContent, "Title is required.");
  await type(container.querySelector("#new-page-title"), "  Field notes  ");
  await click(button("Next >"));
  await click(button("Finish"));
  assert.equal(container.querySelector("#article-title").value, "Field notes");
  const body = "First paragraph.\n\nSecond <em>paragraph</em>.";
  await type(container.querySelector("textarea"), body);
  await click(button("Save article"));
  assert.match(container.querySelector('[role="alert"]').textContent, /Connection lost/);
  assert.equal(container.querySelector("textarea").value, body);
  await click(button("Save article"));
  assert.deepEqual(submissions[1], submissions[0]);
  assert.deepEqual(submissions[1].blocks, [{ kind: "text", text: body }]);
  assert.equal(container.querySelector("article h1").textContent, "Field notes");
  assert.equal(container.querySelector("article p").textContent, body);
  assert.equal(container.querySelector("article em"), null);
  assert.ok([...container.querySelectorAll("input")].some((node) => node.value === "collection://article/7"));
});

test("article edits can be cancelled or retarget a link while preserving independently edited text", async () => {
  const article = { id: 7, title: "Catalog notes", blocks: [
    { kind: "text", id: 11, text: "Saved text" },
    { kind: "item-link", id: 12, item_id: 17, item_title: "Former target" },
    { kind: "gallery", id: 13, entries: [
      { path: "/media/copies/back.png", caption: "Back of box" },
      { path: "/media/copies/front.png", caption: "Front of box" },
    ] },
  ] };
  const edits = [];
  const searches = [];
  const fetchOther = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const location = new URL(url);
    if (location.pathname === "/articles/7") {
      if (options?.method === "PATCH") {
        const changes = JSON.parse(options.body);
        edits.push(changes);
        article.title = changes.title;
        Object.assign(article.blocks[1], { item_id: changes.item_id, item_title: storedItem.display_title });
      }
      return Response.json(article);
    }
    if (location.pathname === "/items/itemlist") searches.push(location.searchParams.get("q"));
    return fetchOther(url, options);
  };
  await render(routed("/collection-view?articleId=7"));
  await click(editButton());
  await type(container.querySelector("textarea"), "Discard this");
  await click(button("Remove link"));
  await click(button("Cancel"));
  assert.equal(edits.length, 0);
  assert.equal(container.querySelector("article p").textContent, "Saved text");
  assert.equal(container.querySelector("article a").textContent, "Former target");
  assert.deepEqual([...container.querySelectorAll("article figcaption")].map((caption) => caption.textContent),
    ["Back of box", "Front of box"]);
  assert.match(container.querySelector("article figure a").href, /\/media\/copies\/back\.png$/);

  await click(editButton());
  article.blocks[0].text = "Updated elsewhere";
  await type(container.querySelector("#article-title"), "Revised title");
  await click(button("Change linked item…"));
  await type(container.querySelector("#article-item-search"), "Original");
  await act(async () => new Promise((resolve) => setTimeout(resolve, 250)));
  assert.ok(searches.includes("Original"));
  await click(button("Original title (#42)"));
  await click(button("Save article"));
  assert.deepEqual(edits, [{ title: "Revised title", item_id: 42 }]);
  assert.equal(container.querySelector("article p").textContent, "Updated elsewhere");
  assert.equal(container.querySelector("article a").getAttribute("href"), "/collection-view?itemId=42");
  await click(container.querySelector("article a"));
  assert.equal(container.querySelector("h1").textContent, "Original title");
  await click(button("Back"));
  assert.equal(container.querySelector("article h1").textContent, "Revised title");
  assert.equal(container.querySelectorAll("article figure").length, 2);
});

const galleryMedia = [
  {
    name: "stored-front.png", relative_path: "copies/stored-front.png", path: "/media/copies/stored-front.png",
    size_bytes: 1024, copy_photos: [
      { copy_id: 14, name: "Front.png", description: "Corner wear" },
      { copy_id: 15, name: "Jacket.png", description: null },
    ],
  },
  {
    name: "Back.png", relative_path: "photos/Back.png", path: "/media/photos/Back.png",
    size_bytes: 1024, copy_photos: [],
  },
];
const imageOption = (name) => [...container.querySelectorAll('[aria-label="Collection images"] input')].find((node) =>
  node.getAttribute("aria-label").startsWith(name),
);
const captionInputs = () => [...container.querySelectorAll('[aria-label="Gallery images"] textarea')];
const galleryCaptions = () => [...container.querySelectorAll("article figcaption")].map((node) => node.textContent);

test("an existing article can save, reopen, cancel and remove a gallery of collection images", async () => {
  const originalBlocks = [
    { kind: "text", id: 11, text: "Saved text" },
    { kind: "item-link", id: 12, item_id: 42, item_title: "Original title" },
  ];
  const article = { id: 7, title: "Catalog notes", blocks: originalBlocks };
  const edits = [];
  let mediaLoads = 0;
  const fetchOther = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const { pathname } = new URL(url);
    if (pathname === "/media/") {
      if (++mediaLoads === 1) return Response.json({ detail: "Media unavailable" }, { status: 503 });
      return Response.json(galleryMedia);
    }
    if (pathname === "/articles/7") {
      if (options?.method === "PATCH") {
        const changes = JSON.parse(options.body);
        edits.push(changes);
        if (edits.length === 1) return Response.json({ detail: "Save failed" }, { status: 503 });
        article.blocks = [...originalBlocks, ...(changes.gallery.length
          ? [{ kind: "gallery", id: 13, entries: changes.gallery }] : [])];
      }
      return Response.json(article);
    }
    return fetchOther(url, options);
  };
  const openImages = () => click(button("Add images…"));
  const command = (label) => container.querySelector(`button[aria-label="${label}"]`);
  const search = (value) => type(container.querySelector("#article-image-search"), value);

  await render(routed("/collection-view?articleId=7"));
  await click(editButton());
  assert.equal(mediaLoads, 0);
  await openImages();
  assert.equal(button("Save article").disabled, true);
  assert.match(container.querySelector('[role="alert"]').textContent, /Media unavailable/);
  await click(button("Retry"));
  await click(imageOption("Front.png"));
  await click(button("Cancel selection"));
  assert.equal(captionInputs().length, 0);
  assert.equal(document.activeElement, button("Add images…"));

  await openImages();
  await search("absent");
  assert.match(container.textContent, /No matching images/);
  await search("copy #14");
  assert.equal(imageOption("Back.png"), undefined);
  assert.ok(imageOption("Front.png"));
  await search("jacket.png");
  await click(imageOption("Front.png"));
  await search("back.png");
  await click(imageOption("Back.png"));
  await click(button("Add selected"));
  await type(captionInputs()[0], "Front\nCorner wear");
  await type(captionInputs()[1], "Back of box");
  await click(command("Move image 2 up"));
  assert.deepEqual(captionInputs().map((node) => node.value), ["Back of box", "Front\nCorner wear"]);
  await click(button("Save article"));
  assert.match(container.querySelector('[role="alert"]').textContent, /Save failed/);
  await click(button("Save article"));
  const ordered = [
    { path: galleryMedia[1].path, caption: "Back of box" },
    { path: galleryMedia[0].path, caption: "Front\nCorner wear" },
  ];
  assert.deepEqual(edits, [{ gallery: ordered }, { gallery: ordered }]);
  assert.equal(container.querySelector("article p").textContent, "Saved text");
  assert.equal(container.querySelector("article a").textContent, "Original title");
  assert.deepEqual(galleryCaptions(), ordered.map((entry) => entry.caption));

  await click(editButton());
  assert.deepEqual(captionInputs().map((node) => node.value), ordered.map((entry) => entry.caption));
  await click(command("Remove image 1"));
  await type(captionInputs()[0], "Discard this caption");
  await click(button("Cancel"));
  assert.equal(edits.length, 2);
  assert.deepEqual(galleryCaptions(), ordered.map((entry) => entry.caption));

  await click(editButton());
  await click(command("Remove image 1"));
  await click(button("Save article"));
  assert.deepEqual(edits.at(-1), { gallery: ordered.slice(1) });
  assert.deepEqual(galleryCaptions(), ["Front\nCorner wear"]);
  await click(editButton());
  await click(command("Remove image 1"));
  await click(button("Save article"));
  assert.deepEqual(edits.at(-1), { gallery: [] });
  assert.equal(container.querySelector("article figure"), null);
});

test("a new article includes its selected images on the first save", async () => {
  const fetchOther = globalThis.fetch;
  let article;
  let created;
  globalThis.fetch = async (url, options) => {
    const { pathname } = new URL(url);
    if (pathname === "/media/") return Response.json(galleryMedia);
    if (pathname === "/articles/") {
      created = JSON.parse(options.body);
      article = { id: 7, title: created.title, blocks: created.blocks.map((block, index) => ({ ...block, id: index + 11 })) };
      return Response.json(article, { status: 201 });
    }
    if (pathname === "/articles/7") return Response.json(article);
    return fetchOther(url, options);
  };
  await render(routed("/page-editor?new=article"));
  await click(button("Next >"));
  await type(container.querySelector("#new-page-title"), "Photo notes");
  await click(button("Next >"));
  await click(button("Finish"));
  await click(button("Add images…"));
  await click(imageOption("Front.png"));
  await click(button("Add selected"));
  await type(captionInputs()[0], "Front of copy");
  await click(button("Save article"));
  assert.deepEqual(created.blocks, [
    { kind: "text", text: "" },
    { kind: "gallery", entries: [{ path: galleryMedia[0].path, caption: "Front of copy" }] },
  ]);
  assert.equal(container.querySelector("article h1").textContent, "Photo notes");
  assert.deepEqual(galleryCaptions(), ["Front of copy"]);
});

test("explorer enables Edit for an item, loads the full form, and displays saved changes", async () => {
  await render(routed("/collection-view"));
  assert.equal(editButton().disabled, true);
  await act(async () => container.querySelector('button[aria-current="false"]').dispatchEvent(
    new dom.window.MouseEvent("dblclick", { bubbles: true, detail: 2 }),
  ));
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

  storedItem.description = "Changed in another editor";
  await type(container.querySelector('input[aria-label="Title"]'), "Updated title");
  await type(container.querySelector('input[aria-label="Short title"]'), "Updated");
  await type(container.querySelector('[aria-label="Page count"]'), "");
  await choose(container.querySelector('[aria-label="Format"]'), "");
  await click(button("Save"));
  assert.equal(savedPayload.titles[0].title_text, "Updated title");
  assert.equal(savedPayload.titles[0].short_text, "Updated");
  assert.equal(savedPayload.format_id, null);
  assert.equal(savedPayload.details.page_count, null);
  assert.equal("author_credits" in savedPayload, false);
  assert.match(container.textContent, /Changed in another editor/);
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

test("checkbox edits set explicit booleans while untouched unknown flags stay null", async () => {
  storedItem.is_owned = null;
  storedItem.languages = [{ ...storedItem.languages[0], ui: null, text: null, voice: null }];
  await render(routed("/page-editor?itemId=42"));
  const owned = container.querySelector('[aria-label="Owned"]');
  const ui = section("Languages").querySelector('[aria-label="UI"]');
  assert.equal(owned.checked, false);
  assert.equal(ui.checked, false);
  await click(owned);
  await click(owned);
  await click(ui);
  await click(button("Save"));
  assert.equal(savedPayload.is_owned, false);
  assert.deepEqual(savedPayload.languages, [{ language_code: "ru", ui: true, text: null, voice: null }]);
});

const generationCheckbox = () => section("Icon").querySelector('input[type="checkbox"]');
const selectCover = async () => {
  const input = section("Cover").querySelector('input[type="file"]');
  Object.defineProperty(input, "files", { configurable: true, value: [new File(["cover"], "cover.png", { type: "image/png" })] });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
};

test("new pages enable automatic generation when a cover is selected and save all image steps in order", async () => {
  let saved;
  await render(createElement(PageEditorWorkspace, {
    initialData: { pageType: "item", itemType: "book", title: "Example" }, onClose() {}, onSaved: (item) => { saved = item; },
  }));
  assert.equal(generationCheckbox().checked, false);
  assert.equal(generationCheckbox().disabled, true);
  await selectCover();
  assert.equal(generationCheckbox().checked, true);
  assert.equal(generationCheckbox().disabled, false);
  assert.equal(section("Icon").querySelector('input[type="file"]').matches(":disabled"), true);
  await click(button("Create"));
  assert.deepEqual(calls.filter((call) => call.method === "POST").map((call) => call.path), ["/items/", "/items/42/cover", "/items/42/icon/from-cover"]);
  assert.equal(saved.icon_image_path, "/media/covers/generated.ico");
});

test("editing defaults generation off and opting in replaces the icon from the saved cover", async () => {
  let saved;
  await render(createElement(PageEditorWorkspace, { existingItem: storedItem, onClose() {}, onSaved: (item) => { saved = item; } }));
  assert.equal(generationCheckbox().checked, false);
  assert.equal(generationCheckbox().disabled, false);
  await click(generationCheckbox());
  await click(button("Save"));
  assert.equal(saved.icon_image_path, "/media/covers/generated.ico");
  assert.deepEqual(calls.filter((call) => call.method !== "GET").map((call) => [call.method, call.path]), [["PATCH", "/items/42"], ["POST", "/items/42/icon/from-cover"]]);
});

test("editing without a cover keeps generation off after selecting a cover until explicitly enabled", async () => {
  await render(createElement(PageEditorWorkspace, { existingItem: { ...storedItem, cover_image_path: null }, onClose() {} }));
  assert.equal(generationCheckbox().disabled, true);
  await selectCover();
  assert.equal(generationCheckbox().disabled, false);
  assert.equal(generationCheckbox().checked, false);
  await click(button("Save"));
  assert.equal(calls.some((call) => call.path.endsWith("/from-cover")), false);
});

test("generation failures keep the checkbox selected and retry without updating the page again", async () => {
  await render(createElement(PageEditorWorkspace, { existingItem: storedItem, onClose() {} }));
  await click(generationCheckbox());
  failGeneration = true;
  await click(button("Save"));
  assert.match(container.querySelector('[role="alert"]').textContent, /Generation failed/);
  assert.equal(generationCheckbox().checked, true);
  assert.match(section("Icon").querySelector("img").src, /icon.png$/);
  failGeneration = false;
  await click(button("Retry image save"));
  assert.equal(calls.filter((call) => call.method === "PATCH").length, 1);
  assert.equal(calls.filter((call) => call.path.endsWith("/from-cover")).length, 2);
  assert.match(section("Icon").querySelector("img").src, /generated.ico$/);
});
