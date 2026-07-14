const OFFSET = 16;
const MARGIN = 8;

export function placePopover(pointer, size, viewport) {
  const fitsRight = pointer.x + OFFSET + size.width + MARGIN <= viewport.width;
  const fitsBelow = pointer.y + OFFSET + size.height + MARGIN <= viewport.height;
  const preferredLeft = fitsRight ? pointer.x + OFFSET : pointer.x - OFFSET - size.width;
  const preferredTop = fitsBelow ? pointer.y + OFFSET : pointer.y - OFFSET - size.height;
  const maxLeft = Math.max(MARGIN, viewport.width - size.width - MARGIN);
  const maxTop = Math.max(MARGIN, viewport.height - size.height - MARGIN);
  return {
    left: Math.min(maxLeft, Math.max(MARGIN, preferredLeft)),
    top: Math.min(maxTop, Math.max(MARGIN, preferredTop)),
  };
}
