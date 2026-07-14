export function activeProjection(model, band) {
  return model.flow.bands[band];
}

export function visibleSelection(model, band, semanticId) {
  if (!model.objects[semanticId]) return null;
  const nodes = activeProjection(model, band).nodes;
  let currentId = semanticId;

  while (currentId) {
    const exact = nodes.find((node) => node.semanticId === currentId);
    if (exact) return exact.id;
    const summary = nodes.find((node) => node.summaryOf?.includes(currentId));
    if (summary) return summary.id;
    currentId = model.objects[currentId]?.parentId ?? null;
  }
  return null;
}
