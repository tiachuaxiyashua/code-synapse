import assert from "node:assert/strict";
import test from "node:test";

import { referencedEvidenceIds } from "./publish-model.mjs";

test("collects only evidence referenced by objects and visual relationships", () => {
  const model = {
    objects: {
      auth: { evidenceIds: ["source:auth"] },
      signup: { evidenceIds: ["source:signup", "source:auth"] },
    },
    flow: {
      bands: {
        Z0: { edges: [{ evidenceIds: ["relation:signup"] }] },
        Z1: { edges: [{ evidenceIds: ["source:signup"] }] },
        Z2: { edges: [] },
      },
    },
  };
  assert.deepEqual([...referencedEvidenceIds(model)].sort(), ["relation:signup", "source:auth", "source:signup"]);
});
