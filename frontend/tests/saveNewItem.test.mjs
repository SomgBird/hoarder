import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { saveExistingItem, saveNewItem } from "../src/pages/PageEditor/PageEditorWorkspace/saveNewItem.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const payload = { details: { type_name: "book" }, titles: [{ title_text: "Example", language_code: "en" }] };
const cover = new File(["image"], "cover.png", { type: "image/png" });

test("editor creates the item before attaching its selected cover", async () => {
  const created = { id: 42, cover_image_path: null };
  const saved = { ...created, cover_image_path: "/media/covers/42-cover.png" };
  let knownItem = null;
  let uploading = false;
  globalThis.fetch = async (url, options) => {
    if (new URL(url).pathname === "/items/") {
      assert.deepEqual(JSON.parse(options.body), payload);
      return Response.json(created, { status: 201 });
    }
    assert.equal(new URL(url).pathname, "/items/42/cover");
    assert.deepEqual(knownItem, created);
    assert.equal(uploading, true);
    assert.equal(options.body.get("file").name, cover.name);
    return Response.json(saved);
  };
  const result = await saveNewItem(payload, cover, null, (item) => { knownItem = item; }, () => { uploading = true; });
  assert.deepEqual(result, saved);
});

test("retrying a failed cover upload reuses the created item", async () => {
  let creates = 0;
  let uploads = 0;
  let knownItem = null;
  globalThis.fetch = async (url) => {
    if (new URL(url).pathname === "/items/") {
      creates += 1;
      return Response.json({ id: 42 }, { status: 201 });
    }
    uploads += 1;
    assert.equal(new URL(url).pathname, "/items/42/cover");
    return uploads === 1
      ? Response.json({ detail: "Upload failed", code: "invalid_image" }, { status: 400 })
      : Response.json({ id: 42, cover_image_path: "/media/covers/retry.png" });
  };
  const remember = (item) => { knownItem = item; };
  await assert.rejects(saveNewItem(payload, cover, knownItem, remember, () => {}), /Upload failed/);
  assert.equal(knownItem.id, 42);
  const result = await saveNewItem(payload, cover, knownItem, remember, () => {});
  assert.equal(result.cover_image_path, "/media/covers/retry.png");
  assert.equal(creates, 1);
  assert.equal(uploads, 2);
});

test("clearing a failed cover lets the editor finish without another request", async () => {
  globalThis.fetch = async () => { throw new Error("No additional requests expected"); };
  const created = { id: 42, cover_image_path: null };
  const unexpected = () => assert.fail("The existing item must be reused without an upload");
  assert.equal(await saveNewItem(payload, null, created, unexpected, unexpected), created);
});

test("creating without a cover sends only the item request", async () => {
  let requests = 0;
  globalThis.fetch = async (url) => {
    requests += 1;
    assert.equal(new URL(url).pathname, "/items/");
    return Response.json({ id: 42 }, { status: 201 });
  };
  await saveNewItem(payload, null, null, () => {}, () => assert.fail("No cover selected"));
  assert.equal(requests, 1);
});

test("retry after icon failure remembers the uploaded cover and creates no duplicate item", async () => {
  const icon = new File(["icon"], "icon.png", { type: "image/png" });
  let knownItem = null;
  let pendingCover = cover;
  const paths = [];
  let failIcon = true;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    paths.push(path);
    if (path === "/items/") return Response.json({ id: 42 });
    if (path.endsWith("/cover")) return Response.json({ id: 42, cover_image_path: "/media/covers/cover.png" });
    if (failIcon) return Response.json({ detail: "Icon upload failed" }, { status: 400 });
    return Response.json({ ...knownItem, icon_image_path: "/media/covers/icon.png" });
  };
  const remember = (item) => { knownItem = item; };
  const uploaded = (kind) => { if (kind === "cover") pendingCover = null; };
  await assert.rejects(saveNewItem(payload, pendingCover, knownItem, remember, () => {}, icon, uploaded), /Icon upload failed/);
  assert.equal(pendingCover, null);
  assert.equal(knownItem.cover_image_path, "/media/covers/cover.png");
  failIcon = false;
  const saved = await saveNewItem(payload, pendingCover, knownItem, remember, () => {}, icon, uploaded);
  assert.equal(saved.cover_image_path, "/media/covers/cover.png");
  assert.equal(saved.icon_image_path, "/media/covers/icon.png");
  assert.deepEqual(paths, ["/items/", "/items/42/cover", "/items/42/icon", "/items/42/icon"]);
});

test("editing patches the same item and retries images without repeating the update", async () => {
  let knownItem = null;
  let pendingCover = cover;
  const icon = new File(["icon"], "icon.png", { type: "image/png" });
  const requests = [];
  let failIcon = true;
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    requests.push([options.method, path]);
    if (path === "/items/42") {
      assert.equal(options.method, "PATCH");
      assert.deepEqual(JSON.parse(options.body), payload);
      return Response.json({ id: 42 });
    }
    if (path.endsWith("/cover")) return Response.json({ id: 42, cover_image_path: "/media/covers/updated.png" });
    if (failIcon) return Response.json({ detail: "Icon upload failed" }, { status: 400 });
    return Response.json({ ...knownItem, icon_image_path: "/media/covers/icon.png" });
  };
  const remember = (item) => { knownItem = item; };
  const uploaded = (kind) => { if (kind === "cover") pendingCover = null; };
  await assert.rejects(saveExistingItem(42, payload, pendingCover, knownItem, remember, () => {}, icon, uploaded), /Icon upload failed/);
  assert.equal(pendingCover, null);
  failIcon = false;
  const saved = await saveExistingItem(42, payload, pendingCover, knownItem, remember, () => {}, icon, uploaded);
  assert.equal(saved.id, 42);
  assert.equal(saved.cover_image_path, "/media/covers/updated.png");
  assert.deepEqual(requests, [["PATCH", "/items/42"], ["POST", "/items/42/cover"], ["POST", "/items/42/icon"], ["POST", "/items/42/icon"]]);
});

test("new pages generate an icon after the cover upload and retry without repeating successful steps", async () => {
  const paths = [];
  let knownItem = null;
  let pendingCover = cover;
  let failGeneration = true;
  let generationPending = true;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    paths.push(path);
    if (path === "/items/") return Response.json({ id: 42 });
    if (path.endsWith("/cover")) return Response.json({ id: 42, cover_image_path: "/media/covers/cover.png" });
    assert.equal(path, "/items/42/icon/from-cover");
    if (failGeneration) return Response.json({ detail: "Generation failed" }, { status: 400 });
    return Response.json({ ...knownItem, icon_image_path: "/media/covers/generated.ico" });
  };
  const remember = (item) => { knownItem = item; };
  const uploaded = (kind) => { if (kind === "cover") pendingCover = null; else generationPending = false; };
  await assert.rejects(saveNewItem(payload, pendingCover, knownItem, remember, () => {}, null, uploaded, generationPending), /Generation failed/);
  assert.equal(pendingCover, null);
  assert.equal(generationPending, true);
  failGeneration = false;
  const saved = await saveNewItem(payload, pendingCover, knownItem, remember, () => {}, null, uploaded, generationPending);
  assert.equal(saved.icon_image_path, "/media/covers/generated.ico");
  assert.equal(generationPending, false);
  assert.deepEqual(paths, ["/items/", "/items/42/cover", "/items/42/icon/from-cover", "/items/42/icon/from-cover"]);
});

test("edits can generate from the saved cover, replacing an existing icon without an upload", async () => {
  const paths = [];
  const stored = { id: 42, cover_image_path: "/media/covers/cover.png", icon_image_path: "/media/covers/old.png" };
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    paths.push([options.method, path]);
    return Response.json(path.endsWith("/from-cover") ? { ...stored, icon_image_path: "/media/covers/new.ico" } : stored);
  };
  const saved = await saveExistingItem(42, payload, null, null, () => {}, () => {}, null, undefined, true);
  assert.equal(saved.icon_image_path, "/media/covers/new.ico");
  assert.deepEqual(paths, [["PATCH", "/items/42"], ["POST", "/items/42/icon/from-cover"]]);
});

test("a failed cover upload prevents generation and generation takes precedence over manual upload", async () => {
  const paths = [];
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    paths.push(path);
    return Response.json({ detail: "Cover failed" }, { status: 400 });
  };
  const icon = new File(["icon"], "icon.png", { type: "image/png" });
  const saved = { id: 42, cover_image_path: "/media/covers/previous.png" };
  await assert.rejects(saveExistingItem(42, payload, cover, saved, () => {}, () => {}, icon, undefined, true), /Cover failed/);
  assert.deepEqual(paths, ["/items/42/cover"]);
  paths.length = 0;
  globalThis.fetch = async (url) => {
    paths.push(new URL(url).pathname);
    return Response.json({ ...saved, icon_image_path: "/media/covers/generated.ico" });
  };
  await saveNewItem(payload, null, saved, () => {}, () => {}, icon, undefined, true);
  assert.deepEqual(paths, ["/items/42/icon/from-cover"]);
});
