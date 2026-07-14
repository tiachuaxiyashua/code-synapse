export const MIN_SCALE = 0.5;
export const MAX_SCALE = 4;

export function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function bandForScale(scale, currentBand) {
  if (currentBand === "Z0") return scale >= 1.5 ? "Z1" : "Z0";
  if (currentBand === "Z2") return scale < 2.5 ? "Z1" : "Z2";
  if (scale < 1.3) return "Z0";
  if (scale >= 2.8) return "Z2";
  return "Z1";
}

export function screenToWorld(point, camera) {
  return {
    x: (point.x - camera.x) / camera.scale,
    y: (point.y - camera.y) / camera.scale,
  };
}

export function zoomAroundPoint(camera, point, requestedScale) {
  const world = screenToWorld(point, camera);
  const scale = clampScale(requestedScale);
  return {
    x: point.x - world.x * scale,
    y: point.y - world.y * scale,
    scale,
    band: bandForScale(scale, camera.band),
  };
}

export function panCamera(camera, delta) {
  return {
    ...camera,
    x: camera.x + delta.x,
    y: camera.y + delta.y,
  };
}
