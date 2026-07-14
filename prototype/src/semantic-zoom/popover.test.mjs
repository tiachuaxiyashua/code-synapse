import assert from "node:assert/strict";
import test from "node:test";

import { placePopover } from "./popover.js";

const viewport = { width: 1200, height: 800 };
const size = { width: 280, height: 190 };

test("places the popover near the pointer by default", () => {
  assert.deepEqual(placePopover({ x: 400, y: 300 }, size, viewport), { left: 416, top: 316 });
});

test("flips before crossing the right or bottom viewport edge", () => {
  assert.deepEqual(placePopover({ x: 1100, y: 740 }, size, viewport), { left: 804, top: 534 });
});

test("clamps the popover inside a small viewport", () => {
  assert.deepEqual(
    placePopover({ x: 4, y: 4 }, { width: 500, height: 400 }, { width: 320, height: 240 }),
    { left: 8, top: 8 },
  );
});
