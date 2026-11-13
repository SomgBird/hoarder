import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiError, API_BASE, request } from "../src/services/client.ts";
import { itemService } from "../src/services/itemService.ts";
import { referenceService } from "../src/services/referenceService.ts";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("404 retains status, domain code and message", async () => {
  globalThis.fetch = async () => Response.json({ detail: "Item 42 not found", code: "item_not_found" }, { status: 404 });
  await assert.rejects(request("/items/42"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 404);
    assert.equal(error.code, "item_not_found");
    assert.equal(error.detail, "Item 42 not found");
    assert.equal(error.message, error.detail);
    return true;
  });
});

test("validation issues survive the client", async () => {
  const issue = { loc: ["body", "titles", 0, "title_text"], msg: "String should have at least 1 character", type: "string_too_short" };
  globalThis.fetch = async () => Response.json({ detail: "Validation failed", code: "validation_error", errors: [issue] }, { status: 422 });
  await assert.rejects(request("/items/", { method: "POST", body: "{}" }), (error) => {
    assert.deepEqual(error.errors, [issue]);
    return true;
  });
});

test("non-JSON server errors still retain the HTTP status", async () => {
  globalThis.fetch = async () => new Response("<html>Bad gateway</html>", { status: 502, statusText: "Bad Gateway" });
  await assert.rejects(request("/items/42"), (error) => error instanceof ApiError && error.status === 502 && error.message.includes("502"));
});

test("204 succeeds without trying to parse a JSON body", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await itemService.delete(1), undefined);
});

test("JSON content type preserves custom headers and abort signal", async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.get("content-type"), "application/json");
    assert.equal(options.headers.get("x-test"), "retained");
    assert.equal(options.signal, controller.signal);
    return Response.json({ id: 1 });
  };
  await request("/items/", { method: "POST", headers: new Headers({ "X-Test": "retained" }), body: "{}", signal: controller.signal });
});

test("cover upload leaves multipart content type to the browser", async () => {
  const file = new File(["image"], "cover.png", { type: "image/png" });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `${API_BASE}/items/3/cover`);
    assert.equal(options.headers.has("content-type"), false);
    assert.ok(options.body instanceof FormData);
    assert.equal(options.body.get("file").name, "cover.png");
    assert.equal(options.method, "POST");
    return Response.json({ id: 3, cover_image_path: "/media/covers/new.png" });
  };
  assert.equal((await itemService.uploadCover(3, file)).id, 3);
});

test("pagination sends offset and limit without a JSON content type on GET", async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `${API_BASE}/items/itemlist?offset=20&limit=20`);
    assert.equal(options.headers.has("content-type"), false);
    assert.equal(options.signal, controller.signal);
    return Response.json({ items: [{ id: 21 }], total: 21, offset: 20, limit: 20 });
  };
  assert.equal((await itemService.list(20, 20, controller.signal)).items[0].id, 21);
});

test("reference search encodes Unicode and literal special characters", async () => {
  globalThis.fetch = async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, "/reference/authors");
    assert.equal(parsed.searchParams.get("q"), "ПУШ % &");
    return Response.json([{ id: 1, name: "Пушкин" }]);
  };
  assert.equal((await referenceService.authors("ПУШ % &"))[0].name, "Пушкин");
});

test("collection ordering sends the selected field and direction with pagination", async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    const params = new URL(url).searchParams;
    assert.equal(params.get("offset"), "20");
    assert.equal(params.get("limit"), "20");
    assert.equal(params.get("sort_by"), "release_date");
    assert.equal(params.get("sort_direction"), "desc");
    assert.equal(options.signal, controller.signal);
    return Response.json({ items: [], total: 0, offset: 20, limit: 20 });
  };
  await itemService.list(20, 20, controller.signal, { sortBy: "release_date", direction: "desc" });
});

test("reference lists preserve item type scope and creation sends a name instead of an ID", async () => {
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url);
    if (options.method === "POST") {
      assert.equal(parsed.pathname, "/reference/franchises");
      assert.deepEqual(JSON.parse(options.body), { name: "A new franchise" });
      return Response.json({ id: 12, name: "A new franchise" });
    }
    assert.equal(parsed.pathname, "/reference/formats");
    assert.equal(parsed.searchParams.get("item_type"), "game");
    return Response.json([{ id: 3, name: "Cartridge" }]);
  };
  assert.equal((await referenceService.list("formats", "game"))[0].name, "Cartridge");
  assert.equal((await referenceService.create("franchises", { name: "A new franchise" })).id, 12);
});
