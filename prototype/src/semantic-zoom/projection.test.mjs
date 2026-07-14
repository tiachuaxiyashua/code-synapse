import assert from "node:assert/strict";
import test from "node:test";

import { activeProjection, visibleSelection } from "./projection.js";

const model = {
  objects: {
    auth: { id: "auth", parentId: null },
    signup: { id: "signup", parentId: "auth" },
    hash: { id: "hash", parentId: "signup" },
    salt: { id: "salt", parentId: "hash" },
  },
  flow: {
    bands: {
      Z0: { nodes: [{ id: "z0-signup", semanticId: "signup", summaryOf: ["hash"] }], edges: [] },
      Z1: { nodes: [{ id: "z1-hash", semanticId: "hash" }], edges: [] },
      Z2: { nodes: [{ id: "z2-salt", semanticId: "salt" }], edges: [] },
    },
  },
};

test("returns only the requested semantic band", () => {
  assert.equal(activeProjection(model, "Z1"), model.flow.bands.Z1);
  assert.equal(activeProjection(model, "Z0").nodes.some((node) => node.id.startsWith("z1")), false);
});

test("keeps a visible selection on itself", () => {
  assert.equal(visibleSelection(model, "Z1", "hash"), "z1-hash");
});

test("maps a hidden descendant to its nearest visible ancestor", () => {
  assert.equal(visibleSelection(model, "Z1", "salt"), "z1-hash");
  assert.equal(visibleSelection(model, "Z0", "salt"), "z0-signup");
});

test("returns null for an unknown selection", () => {
  assert.equal(visibleSelection(model, "Z0", "unknown"), null);
});
