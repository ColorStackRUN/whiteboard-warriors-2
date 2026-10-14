import test from "node:test";
import assert from "node:assert/strict";
import { createDemoModel, seedState, STORAGE_KEY } from "../demo/model.js";

const input = {
  title: "Green backpack",
  description: "A green bag with a notebook.",
  category: "Bags",
  location: "Student lounge",
  photo: "data:image/png;base64,aGVsbG8=",
};
function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}
test("seed listings are illustrative and searchable by description, category, and location", () => {
  const demo = createDemoModel();
  assert.equal(demo.search("BACKPACK").items.length, 1);
  assert.equal(demo.search("notebook").items.length, 1);
  assert.equal(demo.search("library").items[0].id, "bottle");
  assert.equal(demo.search("", "returned").items[0].id, "keys");
  assert.equal(demo.search("missing").items.length, 0);
});
test("posting stores a photo separately and a reference in the database record", () => {
  const demo = createDemoModel({ makeId: () => "new-item" });
  const { listing, trace } = demo.create(input, "maya");
  assert.equal(listing.ownerId, "maya");
  assert.equal(listing.status, "found");
  assert.equal(listing.photoRef, "photo-new-item");
  assert.equal(Object.hasOwn(listing, "photo"), false);
  assert.equal(demo.photo(listing.photoRef), input.photo);
  assert.equal(trace[0].node, "website");
  assert.equal(trace.at(-1).node, "website");
  assert.ok(
    trace.findIndex((step) => step.node === "storage") <
      trace.findIndex((step) => step.node === "database"),
  );
});
test("a non-owner cannot change a listing, even when invoking the model directly", () => {
  const demo = createDemoModel();
  const before = demo.snapshot();
  assert.throws(
    () => demo.markReturned("backpack", "jordan"),
    (error) =>
      error.code === "FORBIDDEN" && error.trace.at(-1).outcome === "denied",
  );
  assert.deepEqual(demo.snapshot(), before);
});
test("only a valid sample student can act, and only an owner can mark returned", () => {
  const demo = createDemoModel();
  assert.throws(
    () => demo.markReturned("backpack", "outsider"),
    (error) => error.code === "IDENTITY",
  );
  assert.throws(
    () => demo.create(input, "outsider"),
    (error) => error.code === "IDENTITY",
  );
  const result = demo.markReturned("backpack", "maya");
  assert.equal(result.listing.status, "returned");
  assert.equal(demo.search("backpack", "found").items.length, 0);
  assert.equal(
    demo.markReturned("backpack", "maya").listing.status,
    "returned",
  );
});
test("all validated fields and safe photo formats are required", () => {
  const demo = createDemoModel();
  for (const invalid of [
    { title: "x" },
    { description: "x" },
    { location: "" },
    { category: "invalid" },
    { photo: "javascript:alert(1)" },
    { photo: "data:image/svg+xml;base64,aGVsbG8=" },
    { photo: `data:image/png;base64,${"a".repeat(2_800_000)}` },
  ])
    assert.throws(
      () => demo.create({ ...input, ...invalid }, "maya"),
      (error) => error.code === "VALIDATION",
    );
  assert.throws(
    () => demo.search("x".repeat(121)),
    (error) => error.code === "VALIDATION",
  );
  assert.throws(
    () => demo.search("", "bogus"),
    (error) => error.code === "VALIDATION",
  );
  assert.throws(
    () => demo.markReturned("missing", "maya"),
    (error) => error.code === "NOT_FOUND",
  );
});
test("records and photos survive a browser storage round trip", () => {
  const storage = memoryStorage();
  const first = createDemoModel({ storage, makeId: () => "persisted" });
  first.create(input, "jordan");
  first.markReturned("persisted", "jordan");
  const second = createDemoModel({ storage });
  assert.deepEqual(second.snapshot(), first.snapshot());
  assert.equal(second.photo("photo-persisted"), input.photo);
});
test("a failed save does not partially create a listing or orphan a photo", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  };
  const demo = createDemoModel({ storage, makeId: () => "fail" });
  const before = demo.snapshot();
  assert.throws(
    () => demo.create(input, "maya"),
    (error) => error.code === "STORAGE",
  );
  assert.deepEqual(demo.snapshot(), before);
  assert.throws(
    () => demo.markReturned("backpack", "maya"),
    (error) => error.code === "STORAGE",
  );
  assert.deepEqual(demo.snapshot(), before);
});
test("invalid or corrupt persisted data falls back to sample data safely", () => {
  for (const value of [
    "{broken",
    "{}",
    JSON.stringify({ ...seedState(), files: {} }),
    JSON.stringify({ ...seedState(), listings: [null] }),
  ]) {
    const demo = createDemoModel({ storage: { getItem: () => value } });
    assert.deepEqual(demo.snapshot(), seedState());
    assert.ok(demo.restoreWarning);
  }
});
test("reset removes added records and image data", () => {
  const storage = memoryStorage();
  const demo = createDemoModel({ storage, makeId: () => "temp" });
  demo.create(input, "maya");
  demo.reset();
  assert.deepEqual(demo.snapshot(), seedState());
  assert.equal(demo.photo("photo-temp"), null);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), seedState());
});
test("snapshot data is not a mutable reference into the model", () => {
  const demo = createDemoModel();
  const snapshot = demo.snapshot();
  snapshot.listings[0].ownerId = "jordan";
  assert.equal(demo.snapshot().listings[0].ownerId, "maya");
});
