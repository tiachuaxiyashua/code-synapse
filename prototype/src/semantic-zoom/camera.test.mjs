import assert from "node:assert/strict";
import test from "node:test";

import {
  bandForScale,
  clampScale,
  panCamera,
  screenToWorld,
  zoomAroundPoint,
} from "./camera.js";

test("clamps scale to the supported range", () => {
  assert.equal(clampScale(0.1), 0.5);
  assert.equal(clampScale(5), 4);
  assert.equal(clampScale(1.8), 1.8);
});

test("changes semantic bands with hysteresis", () => {
  assert.equal(bandForScale(1.49, "Z0"), "Z0");
  assert.equal(bandForScale(1.5, "Z0"), "Z1");
  assert.equal(bandForScale(1.35, "Z1"), "Z1");
  assert.equal(bandForScale(1.29, "Z1"), "Z0");
  assert.equal(bandForScale(2.8, "Z1"), "Z2");
  assert.equal(bandForScale(2.6, "Z2"), "Z2");
  assert.equal(bandForScale(2.49, "Z2"), "Z1");
});

test("keeps the world point under the pointer while zooming", () => {
  const camera = { x: 30, y: 50, scale: 1, band: "Z0" };
  const pointer = { x: 400, y: 300 };
  const before = screenToWorld(pointer, camera);
  const next = zoomAroundPoint(camera, pointer, 2);
  assert.deepEqual(screenToWorld(pointer, next), before);
  assert.equal(next.band, "Z1");
});

test("middle-button pan changes only camera position", () => {
  const camera = { x: 30, y: 50, scale: 1.7, band: "Z1" };
  assert.deepEqual(panCamera(camera, { x: 20, y: -10 }), { x: 50, y: 40, scale: 1.7, band: "Z1" });
});
